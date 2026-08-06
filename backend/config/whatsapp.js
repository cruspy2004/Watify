const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const isHeadless = process.env.WHATSAPP_HEADLESS === 'true';
const USER_AGENT = process.env.WHATSAPP_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';

// Session directory for storing WhatsApp session data
const SESSION_DIR = path.join(__dirname, '..', '.wwebjs_auth');

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Stable event bus. The underlying Client instance is thrown away and rebuilt on
// every restart, so anything that subscribes to the client directly loses its
// listeners the moment we reconnect. Consumers subscribe to this bus instead —
// it outlives every client generation.
const bus = new EventEmitter();
bus.setMaxListeners(50);

// whatsapp-web.js drives WhatsApp Web's own minified bundle, so a WhatsApp
// release can break `getChats()` et al. with an unreadable error (a minified
// throw such as "r"). The library defaults to webVersionCache.type='local',
// which pins nothing — it loads whatever WhatsApp serves today.
//
// Setting WHATSAPP_WEB_VERSION forces a known-good snapshot instead. Values are
// the filenames published at github.com/wppconnect-team/wa-version (html/).
// Leave unset to keep the library default.
const CACHE_DIR = path.join(__dirname, '..', '.wwebjs_cache');
const PINNED_WEB_VERSION = process.env.WHATSAPP_WEB_VERSION;

const buildWebVersionOptions = () => {
    if (!PINNED_WEB_VERSION) return {};

    // Prefer a build already sitting in the local cache — no network, and the
    // cache is keyed by absolute path so it resolves no matter which directory
    // the server was launched from (LocalWebCache defaults to a CWD-relative
    // './.wwebjs_cache/', which silently misses when started from the repo root).
    const cached = path.join(CACHE_DIR, `${PINNED_WEB_VERSION}.html`);
    if (fs.existsSync(cached)) {
        console.log(`📌 Pinning WhatsApp Web ${PINNED_WEB_VERSION} from local cache`);
        return {
            webVersion: PINNED_WEB_VERSION,
            webVersionCache: { type: 'local', path: CACHE_DIR, strict: true }
        };
    }

    console.log(`📌 Pinning WhatsApp Web ${PINNED_WEB_VERSION} from remote snapshot`);
    return {
        webVersion: PINNED_WEB_VERSION,
        webVersionCache: {
            type: 'remote',
            remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${PINNED_WEB_VERSION}.html`,
            strict: true
        }
    };
};

const webVersionOptions = buildWebVersionOptions();

// Enhanced client configuration with better error handling
const clientConfig = {
    userAgent: USER_AGENT,
    ...webVersionOptions,
    authStrategy: new LocalAuth({
        clientId: 'watify-client',
        dataPath: SESSION_DIR
    }),
    puppeteer: {
        headless: isHeadless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-background-networking',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        executablePath: undefined,
        timeout: 60000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        ignoreDefaultArgs: ['--disable-extensions'],
        defaultViewport: null
    },
    authTimeoutMs: 60000,
    qrMaxRetries: 10,
    restartOnAuthFail: false,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 30000,
    session: 'watify-session'
};

let client;
let isClientDestroyed = false;

// Global state tracking
let clientState = {
    isReady: false,
    isAuthenticated: false,
    qrCode: null,
    lastSeen: null,
    connectionAttempts: 0,
    maxRetries: 3,
    restartInProgress: false,
    clientInfo: null,
    sessionClosed: false
};

// Process-level guards are registered once, not per client generation —
// re-registering them on every restart leaked listeners.
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes('Session closed')) {
        console.log('⚠️ Puppeteer session closed - this is normal during restart');
        return;
    }
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('Session closed')) {
        console.log('⚠️ Puppeteer session closed exception - handling gracefully');
        return;
    }
    console.error('❌ Uncaught Exception:', error);
});

// Attach every handler to a given client instance and forward the interesting
// events onto the stable bus. Called for each new client, so a restart never
// leaves us with a half-wired instance.
const attachEventHandlers = (c) => {
    c.on('qr', (qr) => {
        console.log('📱 QR Code generated. Please scan with WhatsApp.');
        qrcode.generate(qr, { small: true });

        clientState.qrCode = qr;
        clientState.isReady = false;
        clientState.isAuthenticated = false;
        clientState.sessionClosed = false;

        bus.emit('qr_ready', qr);
    });

    c.on('ready', async () => {
        console.log('✅ WhatsApp client is ready and connected!');

        try {
            let info = null;
            let retries = 3;

            while (retries > 0 && !info) {
                try {
                    info = c.info;
                    break;
                } catch (error) {
                    if (error.message && error.message.includes('Session closed')) {
                        console.log('⚠️ Session closed while getting info, retrying...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        retries--;
                        continue;
                    }
                    throw error;
                }
            }

            clientState.isReady = true;
            clientState.isAuthenticated = true;
            clientState.qrCode = null;
            clientState.lastSeen = new Date();
            clientState.connectionAttempts = 0;
            clientState.sessionClosed = false;

            if (info) {
                clientState.clientInfo = info;

                console.log(`📱 Connected as: ${info.pushname || info.wid.user}`);
                console.log(`📞 Phone: ${info.wid.user}`);
            } else {
                console.log('⚠️ Could not get client info after retries');
            }

            bus.emit('client_ready', info);

        } catch (error) {
            console.error('❌ Error getting client info on ready:', error.message);
            // Don't fail the ready state for info errors
            clientState.isReady = true;
            clientState.isAuthenticated = true;
            clientState.qrCode = null;
            clientState.lastSeen = new Date();
            clientState.connectionAttempts = 0;
            bus.emit('client_ready', null);
        }
    });

    c.on('authenticated', () => {
        console.log('🔐 WhatsApp client authenticated successfully');
        clientState.isAuthenticated = true;
        clientState.qrCode = null;
        clientState.sessionClosed = false;

        bus.emit('client_authenticated');
    });

    c.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);

        clientState.isAuthenticated = false;
        clientState.isReady = false;
        clientState.connectionAttempts++;

        bus.emit('auth_failed', msg);

        if (
            clientState.connectionAttempts < clientState.maxRetries &&
            !clientState.restartInProgress &&
            !String(msg || '').toLowerCase().includes('qr')
        ) {
            console.log(`🔄 Attempting to restart client (${clientState.connectionAttempts}/${clientState.maxRetries})`);
            setTimeout(() => {
                restartClient();
            }, 5000);
        }
    });

    c.on('disconnected', (reason) => {
        console.log('🔌 WhatsApp client disconnected:', reason);
        const wasAuthenticated = clientState.isAuthenticated;

        clientState.isReady = false;
        clientState.isAuthenticated = false;
        clientState.lastSeen = new Date();

        if (reason === 'NAVIGATION' || reason === 'TIMEOUT' || String(reason).includes('Session closed')) {
            clientState.sessionClosed = true;
            console.log('🔄 Session closed detected - this is normal during navigation/restart');
        }

        bus.emit('client_disconnected', reason);

        if (wasAuthenticated && (reason === 'NAVIGATION' || reason === 'TIMEOUT')) {
            console.log('🔄 Attempting to reconnect due to navigation/timeout...');
            setTimeout(() => {
                if (!clientState.restartInProgress) {
                    restartClient();
                }
            }, 10000);
        }
    });

    c.on('loading_screen', (percent, message) => {
        console.log(`⏳ Loading: ${percent}% - ${message}`);
    });

    c.on('change_state', (state) => {
        console.log('🔄 WhatsApp state changed:', state);
        clientState.lastSeen = new Date();
        bus.emit('state_changed', state);
    });

    c.on('message_create', async (message) => {
        try {
            if (!message.fromMe) {
                console.log(`📩 Incoming message from ${message.from}: ${message.body}`);
                bus.emit('incoming_message', message);
            }
        } catch (error) {
            if (error.message && error.message.includes('Session closed')) {
                console.log('⚠️ Session closed during message handling - ignoring');
                return;
            }
            console.error('❌ Error in message_create handler:', error.message);
        }
    });

    c.on('message', async (message) => {
        try {
            const contact = await message.getContact();
            console.log(`📨 Message from ${contact.pushname || contact.number}: ${message.body}`);
            bus.emit('message_received', { message, contact });
        } catch (error) {
            if (error.message && error.message.includes('Session closed')) {
                console.log('⚠️ Session closed during contact fetch - ignoring');
                return;
            }
            console.error('❌ Error processing message:', error.message);
        }
    });

    c.on('group_join', (notification) => {
        try {
            console.log('👥 Someone joined a group:', notification);
            bus.emit('group_member_added', notification);
        } catch (error) {
            console.error('❌ Error in group_join handler:', error.message);
        }
    });

    c.on('group_leave', (notification) => {
        try {
            console.log('👥 Someone left a group:', notification);
            bus.emit('group_member_removed', notification);
        } catch (error) {
            console.error('❌ Error in group_leave handler:', error.message);
        }
    });

    c.on('error', (error) => {
        console.error('❌ WhatsApp client error:', error.message);

        if (error.message && error.message.includes('Session closed')) {
            console.log('⚠️ Session closed error detected - marking as closed');
            clientState.sessionClosed = true;
            return;
        }

        bus.emit('client_error', error);
    });
};

// Create client with enhanced error handling
const createClient = () => {
    try {
        if (client && !isClientDestroyed) {
            console.log('🔄 Destroying existing client before creating new one...');
            client.destroy().catch(() => {}); // Ignore errors during cleanup
        }

        isClientDestroyed = false;
        client = new Client(clientConfig);
        attachEventHandlers(client);

        return client;
    } catch (error) {
        console.error('❌ Error creating WhatsApp client:', error);
        throw error;
    }
};

// Initialize client
client = createClient();

// Restart function with proper cleanup and session handling
const restartClient = async () => {
    if (clientState.restartInProgress) {
        console.log('⚠️ Restart already in progress...');
        return;
    }

    try {
        clientState.restartInProgress = true;
        console.log('🔄 Restarting WhatsApp client...');

        // Reset state
        clientState.isReady = false;
        clientState.isAuthenticated = false;
        clientState.qrCode = null;
        clientState.sessionClosed = false;

        // Destroy existing client with timeout
        if (client && !isClientDestroyed) {
            try {
                isClientDestroyed = true;
                console.log('🗑️ Destroying existing client...');

                const destroyPromise = client.destroy();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Destroy timeout')), 10000)
                );

                await Promise.race([destroyPromise, timeoutPromise]);
                console.log('✅ Client destroyed successfully');

            } catch (error) {
                console.log('⚠️ Error destroying client (expected):', error.message);
                // This is often expected when the session is already closed
            }
        }

        // Wait before creating new client
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create new client — createClient() wires up every handler for us
        console.log('🔧 Creating new client...');
        client = createClient();

        // Reinitialize
        await client.initialize();

        console.log('✅ WhatsApp client restarted successfully');

    } catch (error) {
        console.error('❌ Error restarting WhatsApp client:', error.message);
        clientState.connectionAttempts++;

        // If restart fails, try again after a longer delay
        if (clientState.connectionAttempts < clientState.maxRetries) {
            console.log(`🔄 Retrying restart in 10 seconds... (${clientState.connectionAttempts}/${clientState.maxRetries})`);
            setTimeout(() => {
                restartClient();
            }, 10000);
        }
    } finally {
        clientState.restartInProgress = false;
    }
};

// Initialize the client with error handling
const initializeWhatsApp = async () => {
    try {
        console.log('🚀 Initializing WhatsApp client...');
        console.log(`📁 Session directory: ${SESSION_DIR}`);

        // Check if session directory is writable
        try {
            fs.accessSync(SESSION_DIR, fs.constants.W_OK);
            console.log('✅ Session directory is writable');
        } catch (error) {
            console.warn('⚠️ Session directory may not be writable:', error.message);
        }

        await client.initialize();
        console.log('✅ WhatsApp client initialization started');

    } catch (error) {
        console.error('❌ Failed to initialize WhatsApp client:', error.message);

        // Handle specific error types
        if (error.message && error.message.includes('Session closed')) {
            console.log('🔄 Session closed during initialization - restarting...');
            setTimeout(() => restartClient(), 2000);
            return;
        }

        clientState.connectionAttempts++;

        // Retry initialization if within limits
        if (clientState.connectionAttempts < clientState.maxRetries) {
            console.log(`🔄 Retrying initialization in 5 seconds... (${clientState.connectionAttempts}/${clientState.maxRetries})`);
            setTimeout(() => {
                initializeWhatsApp();
            }, 5000);
        } else {
            throw error;
        }
    }
};

// Graceful shutdown handler
const shutdownClient = async () => {
    try {
        console.log('🛑 Shutting down WhatsApp client...');
        clientState.isReady = false;
        clientState.isAuthenticated = false;

        if (client && !isClientDestroyed) {
            isClientDestroyed = true;
            await client.destroy();
        }
        console.log('✅ WhatsApp client shut down successfully');
    } catch (error) {
        console.log('⚠️ Error shutting down WhatsApp client (expected):', error.message);
    }
};

// Health check function with session status
const getClientHealth = () => {
    let clientStateInfo = 'UNKNOWN';

    if (isClientDestroyed) {
        clientStateInfo = 'DESTROYED';
    } else if (!client) {
        clientStateInfo = 'NOT_INITIALIZED';
    } else if (clientState.isReady) {
        clientStateInfo = 'CONNECTED';
    } else if (clientState.qrCode) {
        clientStateInfo = 'QR_READY';
    } else if (clientState.restartInProgress) {
        clientStateInfo = 'RESTARTING';
    } else {
        clientStateInfo = 'INITIALIZING';
    }

    return {
        isReady: clientState.isReady,
        isAuthenticated: clientState.isAuthenticated,
        hasQR: !!clientState.qrCode,
        lastSeen: clientState.lastSeen,
        connectionAttempts: clientState.connectionAttempts,
        clientInfo: clientState.clientInfo,
        state: clientStateInfo,
        restartInProgress: clientState.restartInProgress,
        sessionClosed: clientState.sessionClosed
    };
};

// Export client and utilities.
//
// `client` MUST be a getter: the value is replaced on every restart, and a plain
// property would hand every consumer a permanently stale, destroyed instance.
// For the same reason, never destructure `client` off this object — read it
// through the module (`whatsapp.client`) at the point of use.
module.exports = {
    get client() {
        return client;
    },
    bus,
    initializeWhatsApp,
    restartClient,
    shutdownClient,
    getClientHealth,
    clientState,
    createClient
};
