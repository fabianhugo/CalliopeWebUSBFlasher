// Flash controller using DAPLink protocol - Extracted and adapted from MakeCode

// DAPLink flash commands
const DAPLinkFlash = {
    OPEN: 0x8A,
    CLOSE: 0x8B,
    WRITE: 0x8C,
    RESET: 0x89
};

// DAP commands
const DAPCommand = {
    INFO: 0x00,
    CONNECT: 0x80
};

// Memory constants
const PAGE_SIZE = 1024; // Calliope flash page size
const CHUNK_SIZE = 62;  // Max data per USB packet

class FlashController {
    constructor(usbDevice) {
        this.usb = usbDevice;
        this.aborted = false;
        this.onProgress = null;
    }

    /**
     * Send DAP command and get response
     */
    async sendDAPCommand(...bytes) {
        const cmd = new Uint8Array(bytes);
        log(`Sending DAP command: 0x${cmd[0].toString(16).padStart(2, '0')} (${cmd.length} bytes) [${Array.from(cmd).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
        
        try {
            await this.usb.sendPacket(cmd);
            log(`Command sent, waiting for response...`);
            
            const response = await this.usb.receivePacket(2000);
            log(`Received response: [${Array.from(response.slice(0, Math.min(16, response.length))).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}${response.length > 16 ? '...' : ''}]`);
            
            // Check if response matches command
            if (response[0] !== cmd[0]) {
                log(`DAP command mismatch: expected 0x${cmd[0].toString(16).padStart(2, '0')}, got 0x${response[0].toString(16).padStart(2, '0')}`);
                throw new Error(`DAP command failed: sent 0x${cmd[0].toString(16)}, got 0x${response[0].toString(16)}`);
            }
            
            log(`DAP command 0x${cmd[0].toString(16).padStart(2, '0')} completed successfully`);
            return response;
        } catch (error) {
            log(`DAP command error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get DAPLink version
     */
    async getDAPLinkVersion() {
        const response = await this.sendDAPCommand(DAPCommand.INFO, 0x04);
        // Extract string from response
        const len = response[1];
        const str = uint8ArrayToString(response.slice(2, 2 + len));
        return str;
    }

    /**
     * Connect to target MCU
     */
    async connect() {
        log('Connecting to target MCU...');
        const response = await this.sendDAPCommand(DAPCommand.CONNECT);
        const binVersion = uint8ArrayToString(response.slice(2, 2 + response[1]));
        log(`Binary version: ${binVersion}`);
        return binVersion;
    }

    /**
     * Full flash using DAPLink vendor commands
     * Flashes the complete HEX file
     * mode: 0x01 = full replace, 0x02 = partial (only write specified pages)
     */
    async fullFlash(hexContent, progressCallback, mode = 0x01) {
        log(`Starting ${mode === 0x02 ? 'partial' : 'full'} flash (DAPLink mode 0x${mode.toString(16)})...`);
        this.aborted = false;
        
        if (progressCallback) {
            this.onProgress = progressCallback;
        }

        try {
            // Open flash session
            log('Opening flash session...');
            const openResponse = await this.sendDAPCommand(DAPLinkFlash.OPEN, mode);
            log(`OPEN response: cmd=0x${openResponse[0].toString(16)}, status=0x${openResponse[1].toString(16)}`);
            
            // Status byte: 0x00 = success, 0x01 = fail, 0x02 = maybe already open?
            // Some devices return 0x02 but it works anyway, so let's continue
            if (openResponse[1] === 0x01) {
                throw new Error(`Flash open failed with status 0x${openResponse[1].toString(16)}`);
            } else if (openResponse[1] !== 0x00) {
                log(`Warning: Flash open returned status 0x${openResponse[1].toString(16)}, continuing anyway...`);
            }

            // Convert HEX to binary
            const hexBytes = stringToUint8Array(hexContent);
            log(`HEX file size: ${formatBytes(hexBytes.length)}`);

            // Write data in chunks
            let offset = 0;
            let sentChunks = 0;
            const totalChunks = Math.ceil(hexBytes.length / CHUNK_SIZE);

            while (offset < hexBytes.length) {
                if (this.aborted) {
                    throw new Error('Flash aborted by user');
                }

                const end = Math.min(hexBytes.length, offset + CHUNK_SIZE);
                const chunk = hexBytes.slice(offset, end);
                
                // Create write command
                const cmd = new Uint8Array(2 + chunk.length);
                cmd[0] = DAPLinkFlash.WRITE;
                cmd[1] = chunk.length;
                cmd.set(chunk, 2);

                await this.sendDAPCommand(...cmd);

                sentChunks++;
                offset = end;

                // Update progress
                if (this.onProgress && sentChunks % 16 === 0) {
                    const percent = (offset / hexBytes.length) * 100;
                    this.onProgress(percent, `Writing: ${sentChunks}/${totalChunks} chunks`);
                }
            }

            // Final progress update
            if (this.onProgress) {
                this.onProgress(100, 'Write complete');
            }

            // Close flash session
            log('Closing flash session...');
            await this.sendDAPCommand(DAPLinkFlash.CLOSE);
            await delay(100);

            // Reset device
            log('Resetting device...');
            await this.sendDAPCommand(DAPLinkFlash.RESET);

            log('Flash completed successfully');
            return { success: true, method: mode === 0x02 ? 'partial' : 'full' };

        } catch (error) {
            log(`Full flash error: ${error.message}`);
            
            // Try to close session on error
            try {
                await this.sendDAPCommand(DAPLinkFlash.CLOSE);
            } catch (e) {
                // Ignore close errors
            }
            
            throw error;
        }
    }

    /**
     * Partial flash — MakeCode-style using dapjs (mirrors reflashAsync in flash.ts).
     *
     * Algorithm:
     *   1. Init DAPFlasher: clear USB pipeline, cortexM.init, reset(halt), read FICR.
     *   2. Parse HEX into page-aligned blocks using the device page size.
     *   3. Read UICR; if code-region is locked fall back to full flash.
     *   4. Run computeChecksums2 ARM blob on device to hash all flash pages.
     *   5. Compare murmur3 hashes; keep only changed pages.
     *   6. If ≥ half the pages changed: full flash.  Otherwise: quick-flash changed pages.
     */
    async partialFlash(hexContent, progressCallback) {
        log('Starting partial flash (dapjs / MakeCode-style)...');
        this.aborted = false;
        if (progressCallback) this.onProgress = progressCallback;

        const flasher = new DAPFlasher(this.usb);

        try {
            // 1. Connect, halt, read FICR page size
            if (this.onProgress) this.onProgress(2, 'Connecting debug interface...');
            await flasher.init();

            // 2. Parse HEX using device page size (known after init)
            const hexBlocks = parseIntelHex(hexContent);
            const newPages  = extractPageAlignedBlocks(hexBlocks, flasher.pageSize);
            log(`New firmware: ${newPages.length} page(s) × ${flasher.pageSize} B`);

            if (newPages.length === 0) throw new Error('HEX file contains no flash data');

            // 3. UICR check — 0x00 and 0xFF both safe (erased/unset)
            const uicr = await flasher.readUICR();
            if (uicr !== 0x00 && uicr !== 0xFF) {
                log('UICR protected — falling back to full flash');
                await flasher._cortexM.reset(false);
                return await this.fullFlash(hexContent, progressCallback);
            }

            // 4. Compute checksums of all flash pages on the device
            if (this.onProgress) this.onProgress(5, 'Computing device checksums...');
            const checksums = await flasher.getFlashChecksums();

            // 5. Filter to changed pages only
            const changedPages = onlyChangedPages(newPages, checksums, flasher.pageSize);
            const threshold    = (newPages.length / 2) | 0;
            log(`Pages: ${changedPages.length} changed / ${newPages.length} total (threshold: ${threshold})`);

            if (changedPages.length === 0) {
                log('Device already up-to-date');
                await flasher._cortexM.reset(false);
                if (this.onProgress) this.onProgress(100, 'Already up-to-date');
                return { success: true, method: 'partial', pagesChanged: 0, pagesTotal: newPages.length };
            }

            // MakeCode heuristic: ≥ half changed → full flash is faster
            if (changedPages.length > threshold) {
                log('More than half pages changed — falling back to full flash');
                await flasher._cortexM.reset(false);
                return await this.fullFlash(hexContent, progressCallback);
            }

            // 6. Quick-flash only the changed pages (resets device when done)
            log(`Quick flash: writing ${changedPages.length} page(s)...`);
            if (this.onProgress) this.onProgress(10, `Writing ${changedPages.length} changed page(s)...`);

            await flasher.quickFlashPages(changedPages, (frac) => {
                if (this.onProgress) {
                    this.onProgress(
                        10 + frac * 85,
                        `Flashed ${Math.round(frac * changedPages.length)}/${changedPages.length} pages`
                    );
                }
            });

            if (this.onProgress) this.onProgress(100, 'Done');
            return { success: true, method: 'partial', pagesChanged: changedPages.length, pagesTotal: newPages.length };

        } catch (error) {
            log(`Partial flash error: ${error.message}`);
            console.error(error);
            try { await flasher._cortexM.reset(false); } catch (_) {}
            throw error;
        }
    }

    /**
     * Main flash entry point
     * Chooses between full and partial flash
     */
    async flash(hexContent, options = {}) {
        const {
            usePartialFlash = true,
            progressCallback = null,
            verifyAfterFlash = false
        } = options;

        // Validate HEX file
        const validation = validateHexFile(hexContent);
        if (!validation.valid) {
            throw new Error(`Invalid HEX file: ${validation.error}`);
        }

        log(`Flashing ${formatBytes(validation.totalSize)}...`);
        log(`Partial flash: ${usePartialFlash ? 'enabled' : 'disabled'}`);

        let result;
        
        if (usePartialFlash) {
            // Try partial flash first
            try {
                result = await this.partialFlash(hexContent, progressCallback);
            } catch (error) {
                log('Partial flash failed, trying full flash...');
                result = await this.fullFlash(hexContent, progressCallback);
            }
        } else {
            // Use full flash
            result = await this.fullFlash(hexContent, progressCallback);
        }

        if (verifyAfterFlash) {
            log('Verification not yet implemented');
            // TODO: Implement flash verification
        }

        return result;
    }

    /**
     * Abort ongoing flash operation
     */
    abort() {
        log('Aborting flash operation...');
        this.aborted = true;
    }

    /**
     * Check if flash is aborted
     */
    isAborted() {
        return this.aborted;
    }
}

/**
 * Create flash controller for a USB device
 */
function createFlashController(usbDevice) {
    return new FlashController(usbDevice);
}
