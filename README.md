# Calliope mini WebUSB Flasher

A standalone web application for flashing Intel HEX files directly to Calliope mini devices using WebUSB.

## Features

- ✅ **No backend required** - Pure client-side application
- ✅ **Direct USB flashing** - Flash hex files directly via WebUSB
- ✅ **Full & Partial flash** - Supports both full and quick partial flashing
- ✅ **Drag & drop** - Easy file upload interface
- ✅ **Progress tracking** - Real-time flash progress
- ✅ **Multi-device support** - Works with DAPLink and Segger J-Link

## Browser Support

- ✅ Chrome 61+
- ✅ Edge 79+
- ✅ Opera 48+
- ❌ Firefox (no WebUSB support)
- ❌ Safari (no WebUSB support)

## Supported Devices

- Calliope mini (all versions)
- Devices with DAPLink CMSIS-DAP interface
- Devices with Segger J-Link interface (Mini 2.0+)

### USB Device IDs

- **DAPLink**: VID `0x0D28`, PID `0x0204`
- **Segger**: VID `0x1366`, PID `0x1015` / `0x1025`

## Usage

### Quick Start

1. **Open the application**
   - Open `index.html` in a supported browser
   - For localhost: `http://localhost:8000/index.html`
   - For production: Must use HTTPS

2. **Load a HEX file**
   - Click "select file" or drag & drop a `.hex` file
   - File will be validated automatically

3. **Connect device**
   - Click "Connect Device"
   - Select your Calliope mini from the browser dialog
   - Wait for connection confirmation

4. **Flash device**
   - Click "Flash Device" button
   - Wait for completion (progress bar shows status)
   - Device will reset automatically

### Local Development

```bash
# Start a simple HTTP server
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Then open: http://localhost:8000
```

### Production Deployment

**Important**: WebUSB requires HTTPS in production!

Options:
- Deploy to GitHub Pages
- Use Netlify/Vercel
- Any HTTPS-enabled web server

## Technical Details

### Architecture

```
┌────────────────────────────────────────┐
│          index.html (UI)               │
└────────────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼───┐    ┌───▼────┐   ┌───▼────┐
│WebUSB  │    │HEX     │   │UF2     │
│Handler │    │Parser  │   │Convert │
└────┬───┘    └───┬────┘   └───┬────┘
     │            │            │
     └────────────┼────────────┘
                  │
            ┌─────▼──────┐
            │   Flash    │
            │ Controller │
            └────────────┘
                  │
            ┌─────▼──────┐
            │  Calliope  │
            │   Device   │
            └────────────┘
```

### Flashing Protocol

The application uses **DAPLink CMSIS-DAP** protocol:

1. **Open Flash Session** (0x8A)
2. **Write Data Chunks** (0x8C) - 62 bytes per chunk
3. **Close Session** (0x8B)
4. **Reset Device** (0x89)

### File Format Support

- **Input**: Intel HEX format (`.hex` files)
- **Intermediate**: UF2 (USB Flashing Format) blocks
- **Output**: Direct flash memory programming

### Memory Layout

- Page size: 1024 bytes
- Chunk size: 62 bytes (USB packet limit)
- Flash base: 0x00000000

## Code Structure

```
calliope-flasher/
├── index.html          # Main UI
├── css/
│   └── style.css       # Styling
├── js/
│   ├── utils.js        # Helper functions
│   ├── hex-parser.js   # Intel HEX parser
│   ├── uf2.js          # UF2 converter
│   ├── webusb.js       # WebUSB device handler
│   ├── flash.js        # Flash controller
│   └── main.js         # Main application logic
└── README.md           # This file
```

### Key Components

1. **hex-parser.js** - Parses Intel HEX format
2. **uf2.js** - Converts HEX to UF2 blocks
3. **webusb.js** - Manages USB device connection
4. **flash.js** - Implements DAPLink flashing protocol
5. **main.js** - Coordinates UI and operations

## Troubleshooting

### Device Not Found

- Make sure device is connected via USB
- Try a different USB cable
- Check if device appears in system devices
- Close other programs using the device

### Connection Failed

- Firmware version 0249+ is required
- Try unplugging and reconnecting
- On Windows, install device drivers
- Check USB cable quality

### Flash Failed

- Verify HEX file is valid
- Try "Full flash" instead of "Partial flash"
- Disconnect and reconnect device
- Check available disk space on device

### Browser Issues

- WebUSB only works on HTTPS (except localhost)
- Try Chrome/Edge if using unsupported browser
- Update browser to latest version
- Check browser console for errors

## API Reference

### WebUSBDevice

```javascript
const device = new WebUSBDevice();
await device.requestDevice();
await device.connect();
await device.sendPacket(data);
const response = await device.receivePacket();
await device.disconnect();
```

### FlashController

```javascript
const flasher = createFlashController(usbDevice);
await flasher.flash(hexContent, {
    usePartialFlash: true,
    progressCallback: (percent, status) => {
        console.log(`${percent}%: ${status}`);
    }
});
```

### HEX Parser

```javascript
const blocks = parseIntelHex(hexContent);
const validation = validateHexFile(hexContent);
const info = getHexFileInfo(hexContent);
```

### UF2 Converter

```javascript
const uf2Data = convertHexToUF2(hexContent, familyId);
const blocks = parseUF2File(uf2Binary);
```

## Security

- User must explicitly grant USB device access
- HTTPS required in production
- No automatic device access
- Device permissions per session only

## Credits

Based on Microsoft MakeCode WebUSB implementation:
- [MakeCode GitHub](https://github.com/microsoft/pxt)
- [MakeCode Calliope](https://github.com/microsoft/pxt-calliope)

## License

Extracted and adapted from MakeCode (MIT License)

## Contributing

This is a minimal implementation extracted from MakeCode. 

Enhancements welcome:
- Add flash verification
- Implement partial flash with checksums
- Add device firmware update
- Support additional devices
- Improve error handling

## Version

1.0.0 - Initial release
