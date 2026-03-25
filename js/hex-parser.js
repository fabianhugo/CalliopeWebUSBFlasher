// Intel HEX file parser - Extracted and adapted from MakeCode

/**
 * Parse hex string to bytes array
 */
function parseHexBytes(hexString) {
    hexString = hexString.replace(/^[\s:]+/, "").replace(/\s+$/g, "");
    const r = [];
    let i = 0;
    while (i < hexString.length) {
        const h = hexString.slice(i, i + 2);
        r.push(parseInt(h, 16));
        i += 2;
    }
    return r;
}

/**
 * Parse a single Intel HEX record line
 */
function parseHexRecord(line) {
    const b = parseHexBytes(line);
    if (!b || b.length < 5) return null;

    const len = b[0];
    const addr = (b[1] << 8) | b[2];
    const type = b[3];
    const data = b.slice(4, 4 + len);
    const checksum = b[4 + len];

    // Verify checksum
    let sum = 0;
    for (let i = 0; i < 4 + len; i++) {
        sum = (sum + b[i]) & 0xff;
    }
    sum = ((~sum) + 1) & 0xff;
    
    if (sum !== checksum) {
        log(`HEX checksum error: expected ${checksum}, got ${sum}`);
        return null;
    }

    return { addr, type, data, len };
}

/**
 * Parse complete Intel HEX file
 * Returns array of {address, data} blocks
 */
function parseIntelHex(hexContent) {
    const lines = hexContent.split(/\r?\n/);
    const blocks = [];
    let currentBlock = null;
    let extendedAddr = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line[0] !== ':') continue;

        const record = parseHexRecord(line);
        if (!record) {
            log(`Failed to parse HEX line ${i + 1}: ${line}`);
            continue;
        }

        switch (record.type) {
            case 0x00: // Data record
                const fullAddr = extendedAddr + record.addr;
                
                // Start new block or continue current one
                if (!currentBlock || 
                    currentBlock.address + currentBlock.data.length !== fullAddr) {
                    if (currentBlock) {
                        blocks.push(currentBlock);
                    }
                    currentBlock = {
                        address: fullAddr,
                        data: []
                    };
                }
                
                currentBlock.data.push(...record.data);
                break;

            case 0x01: // End of file
                if (currentBlock) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                break;

            case 0x02: // Extended segment address
                extendedAddr = ((record.data[0] << 8) | record.data[1]) << 4;
                break;

            case 0x03: // Start segment address (execution start address - ignored)
                break;

            case 0x04: // Extended linear address
                extendedAddr = ((record.data[0] << 8) | record.data[1]) << 16;
                break;

            case 0x05: // Start linear address (execution start address - ignored)
                break;

            default:
                // Silently ignore unknown record types (they don't affect flashing)
                // log(`Unknown HEX record type: ${record.type}`);
        }
    }

    // Add final block
    if (currentBlock) {
        blocks.push(currentBlock);
    }

    return blocks;
}

/**
 * Extract page-aligned blocks from parsed HEX blocks.
 * Returns one block of exactly pageSize bytes per page that contains data;
 * gaps within a page are filled with 0xFF.
 */
function extractPageAlignedBlocks(hexBlocks, pageSize) {
    const pages = new Map();

    for (const block of hexBlocks) {
        let offset = 0;
        while (offset < block.data.length) {
            const addr = block.address + offset;
            const pageNum = Math.floor(addr / pageSize);
            const pageOffset = addr % pageSize;

            if (!pages.has(pageNum)) {
                pages.set(pageNum, new Uint8Array(pageSize).fill(0xFF));
            }

            const page = pages.get(pageNum);
            const bytesInPage = Math.min(block.data.length - offset, pageSize - pageOffset);
            for (let i = 0; i < bytesInPage; i++) {
                page[pageOffset + i] = block.data[offset + i];
            }
            offset += bytesInPage;
        }
    }

    return [...pages.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([pageNum, data]) => ({ address: pageNum * pageSize, data }));
}

/**
 * Serialize an array of {address, data} blocks to Intel HEX text.
 */
function generateIntelHex(blocks) {
    function hexByte(b) { return b.toString(16).padStart(2, '0').toUpperCase(); }
    function record(type, addr16, data) {
        const bytes = [data.length, (addr16 >> 8) & 0xFF, addr16 & 0xFF, type, ...data];
        let sum = bytes.reduce((a, b) => a + b, 0);
        bytes.push(((~sum) + 1) & 0xFF);
        return ':' + bytes.map(hexByte).join('');
    }

    const lines = [];
    let currentBase = null;

    for (const block of blocks) {
        const base = block.address & 0xFFFF0000;
        if (base !== currentBase) {
            currentBase = base;
            const high = base >>> 16;
            lines.push(record(0x04, 0, [(high >> 8) & 0xFF, high & 0xFF]));
        }

        const addr16 = block.address & 0xFFFF;
        const data = block.data instanceof Uint8Array ? Array.from(block.data) : block.data;
        let offset = 0;
        while (offset < data.length) {
            const chunk = data.slice(offset, Math.min(data.length, offset + 16));
            lines.push(record(0x00, (addr16 + offset) & 0xFFFF, chunk));
            offset += 16;
        }
    }

    lines.push(':00000001FF');
    return lines.join('\n');
}

/**
 * Validate HEX file content
 */
function validateHexFile(hexContent) {
    if (!hexContent || hexContent.length === 0) {
        return { valid: false, error: 'Empty file' };
    }

    const lines = hexContent.split(/\r?\n/).filter(l => l.trim());
    
    if (lines.length === 0) {
        return { valid: false, error: 'No valid lines found' };
    }

    // Check if at least one line starts with ':'
    if (!lines.some(l => l.trim().startsWith(':'))) {
        return { valid: false, error: 'Not a valid Intel HEX file (no lines start with ":")' };
    }

    // Try to parse
    try {
        const blocks = parseIntelHex(hexContent);
        if (blocks.length === 0) {
            return { valid: false, error: 'No data blocks found in HEX file' };
        }

        // Calculate total size
        const totalSize = blocks.reduce((sum, b) => sum + b.data.length, 0);

        return { 
            valid: true, 
            blocks: blocks.length,
            totalSize: totalSize
        };
    } catch (e) {
        return { valid: false, error: `Parse error: ${e.message}` };
    }
}

/**
 * Get HEX file info for display
 */
function getHexFileInfo(hexContent) {
    const validation = validateHexFile(hexContent);
    
    if (!validation.valid) {
        return null;
    }

    const blocks = parseIntelHex(hexContent);
    
    // Find address range
    let minAddr = Number.MAX_SAFE_INTEGER;
    let maxAddr = 0;
    
    for (const block of blocks) {
        minAddr = Math.min(minAddr, block.address);
        maxAddr = Math.max(maxAddr, block.address + block.data.length);
    }

    return {
        blocks: blocks.length,
        totalSize: validation.totalSize,
        startAddress: '0x' + minAddr.toString(16).toUpperCase(),
        endAddress: '0x' + maxAddr.toString(16).toUpperCase(),
        addressRange: maxAddr - minAddr
    };
}
