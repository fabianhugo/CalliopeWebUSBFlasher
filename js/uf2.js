// UF2 (USB Flashing Format) converter - Extracted and adapted from MakeCode

const UF2 = {
    MAGIC_START0: 0x0A324655, // "UF2\n"
    MAGIC_START1: 0x9E5D5157,
    MAGIC_END: 0x0AB16F30,
    FLAG_FAMILY_ID_PRESENT: 0x00002000,
    BLOCK_SIZE: 512,
    DATA_SIZE: 256
};

/**
 * Create a new UF2 block file structure
 */
function newUF2BlockFile() {
    return {
        blocks: [],
        totalBlocks: 0
    };
}

/**
 * Convert Intel HEX blocks to UF2 blocks
 */
function hexToUF2(hexBlocks, familyId = 0x0D28) {
    const uf2File = newUF2BlockFile();
    let blockNum = 0;

    // Convert each hex block to UF2 blocks
    for (const hexBlock of hexBlocks) {
        let addr = hexBlock.address;
        let data = new Uint8Array(hexBlock.data);
        
        // Split into 256-byte chunks
        for (let offset = 0; offset < data.length; offset += UF2.DATA_SIZE) {
            const chunkSize = Math.min(UF2.DATA_SIZE, data.length - offset);
            const chunk = data.slice(offset, offset + chunkSize);
            
            uf2File.blocks.push({
                flags: UF2.FLAG_FAMILY_ID_PRESENT,
                targetAddr: addr + offset,
                payloadSize: chunkSize,
                blockNo: blockNum++,
                familyId: familyId,
                data: chunk
            });
        }
    }

    // Set total block count
    uf2File.totalBlocks = uf2File.blocks.length;
    for (const block of uf2File.blocks) {
        block.numBlocks = uf2File.totalBlocks;
    }

    return uf2File;
}

/**
 * Serialize UF2 block to 512-byte buffer
 */
function serializeUF2Block(block) {
    const buf = new Uint8Array(UF2.BLOCK_SIZE);
    
    // Write header
    write32(buf, 0, UF2.MAGIC_START0);
    write32(buf, 4, UF2.MAGIC_START1);
    write32(buf, 8, block.flags);
    write32(buf, 12, block.targetAddr);
    write32(buf, 16, block.payloadSize);
    write32(buf, 20, block.blockNo);
    write32(buf, 24, block.numBlocks);
    write32(buf, 28, block.familyId);
    
    // Write data (256 bytes starting at offset 32)
    buf.set(block.data, 32);
    
    // Write footer magic
    write32(buf, 508, UF2.MAGIC_END);
    
    return buf;
}

/**
 * Serialize complete UF2 file to Uint8Array
 */
function serializeUF2File(uf2File) {
    const totalSize = uf2File.blocks.length * UF2.BLOCK_SIZE;
    const buf = new Uint8Array(totalSize);
    
    for (let i = 0; i < uf2File.blocks.length; i++) {
        const blockBuf = serializeUF2Block(uf2File.blocks[i]);
        buf.set(blockBuf, i * UF2.BLOCK_SIZE);
    }
    
    return buf;
}

/**
 * Parse UF2 block from 512-byte buffer
 */
function parseUF2Block(buf) {
    if (buf.length !== UF2.BLOCK_SIZE) return null;
    
    const start0 = read32(buf, 0);
    const start1 = read32(buf, 4);
    const end = read32(buf, 508);
    
    if (start0 !== UF2.MAGIC_START0 || 
        start1 !== UF2.MAGIC_START1 || 
        end !== UF2.MAGIC_END) {
        return null;
    }
    
    const flags = read32(buf, 8);
    const payloadSize = read32(buf, 16);
    
    return {
        flags: flags,
        targetAddr: read32(buf, 12),
        payloadSize: payloadSize > 476 ? 256 : payloadSize,
        blockNo: read32(buf, 20),
        numBlocks: read32(buf, 24),
        familyId: read32(buf, 28),
        data: buf.slice(32, 32 + payloadSize)
    };
}

/**
 * Parse complete UF2 file
 */
function parseUF2File(buf) {
    const blocks = [];
    for (let i = 0; i < buf.length; i += UF2.BLOCK_SIZE) {
        const block = parseUF2Block(buf.slice(i, i + UF2.BLOCK_SIZE));
        if (block) {
            blocks.push(block);
        }
    }
    return blocks;
}

/**
 * Convert Intel HEX to UF2 binary
 * Main entry point for HEX to UF2 conversion
 */
function convertHexToUF2(hexContent, familyId = 0x0D28) {
    log('Converting HEX to UF2...');
    
    // Parse HEX file
    const hexBlocks = parseIntelHex(hexContent);
    if (!hexBlocks || hexBlocks.length === 0) {
        throw new Error('Failed to parse HEX file');
    }
    
    log(`Parsed ${hexBlocks.length} HEX blocks`);
    
    // Convert to UF2
    const uf2File = hexToUF2(hexBlocks, familyId);
    log(`Created ${uf2File.blocks.length} UF2 blocks`);
    
    // Serialize to binary
    const uf2Binary = serializeUF2File(uf2File);
    log(`UF2 binary size: ${formatBytes(uf2Binary.length)}`);
    
    return {
        binary: uf2Binary,
        blocks: uf2File.blocks,
        totalBlocks: uf2File.totalBlocks
    };
}

/**
 * Align UF2 blocks to page boundaries
 */
function pageAlignBlocks(blocks, pageSize) {
    const aligned = [];
    
    for (const block of blocks) {
        const addr = block.targetAddr;
        const pageStart = Math.floor(addr / pageSize) * pageSize;
        const pageEnd = Math.ceil((addr + block.payloadSize) / pageSize) * pageSize;
        
        // Create page-aligned block
        const alignedData = new Uint8Array(pageEnd - pageStart);
        alignedData.fill(0xFF); // Flash erased state
        
        // Copy actual data
        const offset = addr - pageStart;
        alignedData.set(block.data, offset);
        
        aligned.push({
            ...block,
            targetAddr: pageStart,
            payloadSize: alignedData.length,
            data: alignedData
        });
    }
    
    return aligned;
}
