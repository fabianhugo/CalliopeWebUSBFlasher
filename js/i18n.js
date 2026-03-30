// Internationalisation — translation dictionaries and helpers

const TRANSLATIONS = {
    en: {
        // Page
        pageTitle: 'WebUSB Flasher',
        subtitle: 'Flash hex files directly to your Calliope mini V1/V2/V3 using WebUSB',
        // Drop zone
        dropPrefix: 'Drop HEX file here or ',
        selectFile: 'select file',
        // Buttons
        loadStartProgram: 'Load Start Program',
        connectDevice: 'Connect Device',
        connected: '✓ Connected',
        flashDevice: 'Flash Device',
        cancel: 'Cancel',
        // Device section
        deviceLabel: 'Device:',
        firmwareLabel: 'Firmware:',
        notConnected: 'Not connected',
        ready: 'Ready',
        // Options
        partialFlashLabel: 'Use partial flash (faster, only changes)',
        verifyFlashLabel: 'Verify after flashing',
        autoFlashLabel: 'Auto-flash on connect (no button click needed)',
        // Footer
        browserSupportLabel: 'Browser Support:',
        browserSupportValue: 'Chrome 61+, Edge 79+, Opera 48+',
        noteLabel: 'Note:',
        noteValue: 'WebUSB requires HTTPS (except localhost)',
        troubleshootingTitle: 'Troubleshooting',
        troubleshootingItem1: 'Make sure your Calliope mini is connected via USB',
        troubleshootingItem2: 'Update your Calliope mini USB firmware if needed',
        troubleshootingItem3: 'Try a different USB cable if connection fails',
        troubleshootingItem4: 'On Windows, install the device driver if needed',
        troubleshootingItem5: 'Close other apps that might use the device (e.g., MakeCode, Python, Arduino IDE)',
        // Dynamic messages
        blocks: 'blocks',
        browserNotSupported: 'Browser not supported: ',
        pleaseSelectHex: 'Please select a .hex file',
        loadingHexFile: 'Loading HEX file...',
        invalidHexFile: 'Invalid HEX file: ',
        hexFileLoaded: 'HEX file loaded successfully',
        failedToLoadFile: 'Failed to load file: ',
        loadingStartProgram: 'Loading start program',
        failedToLoadStartProgram: 'Failed to load start program: ',
        requestingDeviceAccess: 'Requesting device access...',
        deviceSelectionCancelled: 'Device selection cancelled',
        connectingToDevice: 'Connecting to device...',
        deviceReady: 'Device connected. Ready to flash.',
        connectionFailed: 'Connection failed: ',
        autoFlashStarting: 'Auto-flash: starting...',
        startingFlashOperation: 'Starting flash operation...',
        preparing: 'Preparing...',
        flashComplete: 'Flash complete!',
        flashedSuccessfully: '✓ Device flashed successfully using {method} flash',
        unplugHint: ' Unplug and reconnect next device to flash again.',
        flashFailed: 'Flash failed: ',
        flashCancelled: 'Flash operation cancelled',
        pleaseLoadHexAndConnect: 'Please load a HEX file and connect a device first',
        partialFlashDisabledTitle: 'Calliope mini 2.x: always full flash via J-Link MSD protocol',
        calliopeDetected: 'Calliope mini detected — connecting automatically...',
        deviceConnectedAuto: 'Device connected automatically. Click "Flash Device" to flash.',
        autoConnectFailed: 'Auto-connect failed: ',
        startProgramPlaceholder: 'Demov1.hex or Demov3.hex',
    },
    de: {
        pageTitle: 'WebUSB-Flasher',
        subtitle: 'HEX-Dateien direkt auf den Calliope mini V1/V2/V3 übertragen via WebUSB',
        dropPrefix: 'HEX-Datei hier ablegen oder ',
        selectFile: 'Datei auswählen',
        loadStartProgram: 'Startprogramm laden',
        connectDevice: 'Gerät verbinden',
        connected: '✓ Verbunden',
        flashDevice: 'Gerät flashen',
        cancel: 'Abbrechen',
        deviceLabel: 'Gerät:',
        firmwareLabel: 'Firmware:',
        notConnected: 'Nicht verbunden',
        ready: 'Bereit',
        partialFlashLabel: 'Partielles Flash (schneller, nur Änderungen)',
        verifyFlashLabel: 'Nach dem Flashen verifizieren',
        autoFlashLabel: 'Auto-Flash beim Verbinden (kein Klick nötig)',
        browserSupportLabel: 'Browser-Unterstützung:',
        browserSupportValue: 'Chrome 61+, Edge 79+, Opera 48+',
        noteLabel: 'Hinweis:',
        noteValue: 'WebUSB erfordert HTTPS (außer localhost)',
        troubleshootingTitle: 'Fehlerbehebung',
        troubleshootingItem1: 'Sicherstellen, dass der Calliope mini per USB verbunden ist',
        troubleshootingItem2: 'USB-Firmware des Calliope mini bei Bedarf aktualisieren',
        troubleshootingItem3: 'Bei Verbindungsproblemen ein anderes USB-Kabel versuchen',
        troubleshootingItem4: 'Unter Windows ggf. den Gerätetreiber installieren',
        troubleshootingItem5: 'Andere Apps schließen, die das Gerät verwenden (z.B. MakeCode, Python, Arduino IDE)',
        blocks: 'Blöcke',
        browserNotSupported: 'Browser nicht unterstützt: ',
        pleaseSelectHex: 'Bitte eine .hex-Datei auswählen',
        loadingHexFile: 'HEX-Datei wird geladen...',
        invalidHexFile: 'Ungültige HEX-Datei: ',
        hexFileLoaded: 'HEX-Datei erfolgreich geladen',
        failedToLoadFile: 'Fehler beim Laden der Datei: ',
        loadingStartProgram: 'Startprogramm wird geladen',
        failedToLoadStartProgram: 'Fehler beim Laden des Startprogramms: ',
        requestingDeviceAccess: 'Gerätezugriff wird angefordert...',
        deviceSelectionCancelled: 'Geräteauswahl abgebrochen',
        connectingToDevice: 'Verbindung wird hergestellt...',
        deviceReady: 'Gerät verbunden. Bereit zum Flashen.',
        connectionFailed: 'Verbindung fehlgeschlagen: ',
        autoFlashStarting: 'Auto-Flash: wird gestartet...',
        startingFlashOperation: 'Flash-Vorgang wird gestartet...',
        preparing: 'Vorbereitung...',
        flashComplete: 'Flash abgeschlossen!',
        flashedSuccessfully: '✓ Gerät erfolgreich geflasht ({method}-Flash)',
        unplugHint: ' Nächstes Gerät einstecken um erneut zu flashen.',
        flashFailed: 'Flash fehlgeschlagen: ',
        flashCancelled: 'Flash-Vorgang abgebrochen',
        pleaseLoadHexAndConnect: 'Bitte eine HEX-Datei laden und ein Gerät verbinden',
        partialFlashDisabledTitle: 'Calliope mini 2.x: immer vollständiger Flash via J-Link MSD',
        calliopeDetected: 'Calliope mini erkannt — verbinde automatisch...',
        deviceConnectedAuto: 'Gerät automatisch verbunden. „Gerät flashen" klicken.',
        autoConnectFailed: 'Auto-Verbindung fehlgeschlagen: ',
        startProgramPlaceholder: 'Demov1.hex oder Demov3.hex',
    }
};

// Use stored preference (only if it's a known language), then browser language, then German
const SUPPORTED_LANGS = Object.keys(TRANSLATIONS);
const _stored = localStorage.getItem('lang');
let currentLang = (SUPPORTED_LANGS.includes(_stored) ? _stored : null) ||
    (navigator.languages || [navigator.language])
        .map(l => l.split('-')[0])
        .find(l => SUPPORTED_LANGS.includes(l)) ||
    'de';

/** Return the translation for key in the current language. */
function t(key) {
    return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || key;
}

/** Re-render all [data-i18n] elements and the page title. */
function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t('pageTitle');
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    const sel = document.getElementById('langSelect');
    if (sel) sel.value = currentLang;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
}

document.addEventListener('DOMContentLoaded', () => {
    // Persist the resolved language so future reloads respect the user's choice
    localStorage.setItem('lang', currentLang);
    applyTranslations();
    const sel = document.getElementById('langSelect');
    if (sel) sel.addEventListener('change', () => setLanguage(sel.value));
});
