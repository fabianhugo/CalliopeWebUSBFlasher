// Utility functions extracted and adapted from MakeCode pxtlib

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str) {
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        buf[i] = str.charCodeAt(i) & 0xff;
    }
    return buf;
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(arr) {
    let r = "";
    for (let i = 0; i < arr.length; i++) {
        r += String.fromCharCode(arr[i]);
    }
    return r;
}

/**
 * Convert buffer to hex string
 */
function toHex(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        hex += ("0" + bytes[i].toString(16)).slice(-2);
    }
    return hex;
}

/**
 * Read 16-bit value from buffer
 */
function read16(buf, pos) {
    return buf[pos] | (buf[pos + 1] << 8);
}

/**
 * Read 32-bit value from buffer
 */
function read32(buf, pos) {
    return (buf[pos] | 
            (buf[pos + 1] << 8) | 
            (buf[pos + 2] << 16) | 
            (buf[pos + 3] << 24)) >>> 0;
}

/**
 * Write 16-bit value to buffer
 */
function write16(buf, pos, val) {
    buf[pos] = val & 0xff;
    buf[pos + 1] = (val >> 8) & 0xff;
}

/**
 * Write 32-bit value to buffer
 */
function write32(buf, pos, val) {
    buf[pos] = val & 0xff;
    buf[pos + 1] = (val >> 8) & 0xff;
    buf[pos + 2] = (val >> 16) & 0xff;
    buf[pos + 3] = (val >> 24) & 0xff;
}

/**
 * Delay for specified milliseconds
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate Murmur3 hash (for flash checksums)
 */
function murmur3_core(data) {
    const imul = Math.imul || function(a, b) {
        const ah = (a >>> 16) & 0xffff;
        const al = a & 0xffff;
        const bh = (b >>> 16) & 0xffff;
        const bl = b & 0xffff;
        return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
    };

    let h0 = 0x2F9BE6CC;
    let h1 = 0x1EC3A6C8;

    for (let i = 0; i < data.length; i += 4) {
        let k = read32(data, i) >>> 0;
        k = imul(k, 0xcc9e2d51);
        k = (k << 15) | (k >>> 17);
        k = imul(k, 0x1b873593);

        h0 ^= k;
        h1 ^= k;
        h0 = (h0 << 13) | (h0 >>> 19);
        h1 = (h1 << 13) | (h1 >>> 19);
        h0 = (imul(h0, 5) + 0xe6546b64) >>> 0;
        h1 = (imul(h1, 5) + 0xe6546b64) >>> 0;
    }
    return [h0, h1];
}

/**
 * Concatenate two Uint8Arrays
 */
function bufferConcat(a, b) {
    const r = new Uint8Array(a.length + b.length);
    r.set(a, 0);
    r.set(b, a.length);
    return r;
}

/**
 * Convert bytes to human readable size
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Log with timestamp
 */
function log(msg) {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    console.log(`[${timestamp}] ${msg}`);
}

/**
 * Check if WebUSB is supported
 */
function isWebUSBSupported() {
    return 'usb' in navigator;
}

/**
 * Check if browser is compatible
 */
function checkBrowserCompatibility() {
    if (!isWebUSBSupported()) {
        return {
            supported: false,
            reason: 'WebUSB is not supported in this browser. Please use Chrome 61+, Edge 79+, or Opera 48+.'
        };
    }
    
    // Check if on Windows XP/Vista/7/8 (not supported)
    const m = /Windows NT (\d+\.\d+)/.exec(navigator.userAgent);
    if (m && parseFloat(m[1]) < 6.3) {
        return {
            supported: false,
            reason: 'WebUSB requires Windows 8.1 or later.'
        };
    }
    
    return { supported: true };
}
