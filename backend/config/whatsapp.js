const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Session directory for storing WhatsApp session data
const SESSION_DIR = path.join(__dirname, '..', '.wwebjs_auth');

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Enhanced client configuration with better error handling
const clientConfig = {
    authStrategy: new LocalAuth({
        clientId: 'watify-client',
        dataPath: SESSION_DIR
    }),
    puppeteer: {
        headless: true,
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
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    authTimeoutMs: 60000,
    qrMaxRetries: 5,
    restartOnAuthFail: true,
    takeoverOnConflict: false,
    takeoverTimeoutMs: 30000,
    session: 'watify-session'
};

// Create client with enhanced error handling
let client;
let isClientDestroyed = false;

const createClient = () => {
    try {
        if (client && !isClientDestroyed) {
            console.log('🔄 Destroying existing client before creating new one...');
            client.destroy().catch(() => {}); // Ignore errors during cleanup
        }
        
        isClientDestroyed = false;
        client = new Client(clientConfig);
        
        // Add error handling to prevent crashes
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

        return client;
    } catch (error) {
        console.error('❌ Error creating WhatsApp client:', error);
        throw error;
    }
};

// Initialize client
client = createClient();

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

// Enhanced event handlers with comprehensive logging and state management
client.on('qr', (qr) => {
    console.log('📱 QR Code generated. Please scan with WhatsApp.');
    qrcode.generate(qr, { small: true });
    
    // Update state
    clientState.qrCode = qr;
    clientState.isReady = false;
    clientState.isAuthenticated = false;
    clientState.sessionClosed = false;
    
    // Emit custom event for service layer
    client.emit('qr_ready', qr);
});

client.on('ready', async () => {
    console.log('✅ WhatsApp client is ready and connected!');
    
    try {
        // Get client info with retry logic
        let info = null;
        let retries = 3;
        
        while (retries > 0 && !info) {
            try {
                info = client.info;
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
        
        if (info) {
            clientState.clientInfo = info;
            clientState.isReady = true;
            clientState.isAuthenticated = true;
            clientState.qrCode = null;
            clientState.lastSeen = new Date();
            clientState.connectionAttempts = 0;
            clientState.sessionClosed = false;
            
            console.log(`📱 Connected as: ${info.pushname || info.wid.user}`);
            console.log(`📞 Phone: ${info.wid.user}`);
            console.log(`🔋 Battery: ${info.battery}%`);
            console.log(`🔌 Plugged: ${info.plugged ? 'Yes' : 'No'}`);
            
            // Emit custom event for service layer
            client.emit('client_ready', info);
        } else {
            console.log('⚠️ Could not get client info after retries');
        }
        
    } catch (error) {
        console.error('❌ Error getting client info on ready:', error.message);
        // Don't fail the ready state for info errors
        clientState.isReady = true;
        clientState.isAuthenticated = true;
        clientState.qrCode = null;
        clientState.lastSeen = new Date();
        clientState.connectionAttempts = 0;
    }
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp client authenticated successfully');
    clientState.isAuthenticated = true;
    clientState.qrCode = null;
    clientState.sessionClosed = false;
    
    // Emit custom event for service layer
    client.emit('client_authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp authentication failed:', msg);
    
    clientState.isAuthenticated = false;
    clientState.isReady = false;
    clientState.connectionAttempts++;
    
    // Emit custom event for service layer
    client.emit('auth_failed', msg);
    
    // Auto-restart if within retry limits
    if (clientState.connectionAttempts < clientState.maxRetries && !clientState.restartInProgress) {
        console.log(`🔄 Attempting to restart client (${clientState.connectionAttempts}/${clientState.maxRetries})`);
        setTimeout(() => {
            restartClient();
        }, 5000);
    }
});

client.on('disconnected', (reason) => {
    console.log('🔌 WhatsApp client disconnected:', reason);
    
    clientState.isReady = false;
    clientState.isAuthenticated = false;
    clientState.lastSeen = new Date();
    
    // Don't treat session closure as a critical error
    if (reason === 'NAVIGATION' || reason === 'TIMEOUT' || reason.includes('Session closed')) {
        clientState.sessionClosed = true;
        console.log('🔄 Session closed detected - this is normal during navigation/restart');
    }
    
    // Emit custom event for service layer
    client.emit('client_disconnected', reason);
    
    // Auto-reconnect for certain disconnection reasons
    if (reason === 'NAVIGATION' || reason === 'TIMEOUT') {
        console.log('🔄 Attempting to reconnect due to navigation/timeout...');
        setTimeout(() => {
            if (!clientState.restartInProgress) {
                restartClient();
            }
        }, 10000);
    }
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
});

client.on('change_state', (state) => {
    console.log('🔄 WhatsApp state changed:', state);
    
    // Update last seen
    clientState.lastSeen = new Date();
    
    // Emit custom event for service layer
    client.emit('state_changed', state);
});

// Message event handlers for incoming messages with error handling
client.on('message_create', async (message) => {
    try {
        if (!message.fromMe) {
            console.log(`📩 Incoming message from ${message.from}: ${message.body}`);
            
            // Emit custom event for service layer to handle incoming messages
            client.emit('incoming_message', message);
        }
    } catch (error) {
        if (error.message && error.message.includes('Session closed')) {
            console.log('⚠️ Session closed during message handling - ignoring');
            return;
        }
        console.error('❌ Error in message_create handler:', error.message);
    }
});

client.on('message', async (message) => {
    try {
        const contact = await message.getContact();
        console.log(`📨 Message from ${contact.pushname || contact.number}: ${message.body}`);
        
        // Emit custom event for service layer
        client.emit('message_received', { message, contact });
        
    } catch (error) {
        if (error.message && error.message.includes('Session closed')) {
            console.log('⚠️ Session closed during contact fetch - ignoring');
            return;
        }
        console.error('❌ Error processing message:', error.message);
    }
});

// Group event handlers with error handling
client.on('group_join', (notification) => {
    try {
        console.log('👥 Someone joined a group:', notification);
        client.emit('group_member_added', notification);
    } catch (error) {
        console.error('❌ Error in group_join handler:', error.message);
    }
});

client.on('group_leave', (notification) => {
    try {
        console.log('👥 Someone left a group:', notification);
        client.emit('group_member_removed', notification);
    } catch (error) {
        console.error('❌ Error in group_leave handler:', error.message);
    }
});

// Enhanced error handler
client.on('error', (error) => {
    console.error('❌ WhatsApp client error:', error.message);
    
    // Handle session closed errors gracefully
    if (error.message && error.message.includes('Session closed')) {
        console.log('⚠️ Session closed error detected - marking as closed');
        clientState.sessionClosed = true;
        return;
    }
    
    // Emit custom event for service layer
    client.emit('client_error', error);
});

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
                
                // Set a timeout for destroy operation
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
        
        // Create new client
        console.log('🔧 Creating new client...');
        client = createClient();
        
        // Re-attach event handlers (they're lost when creating new client)
        setupEventHandlers();
        
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

// Function to setup event handlers (used when recreating client)
const setupEventHandlers = () => {
    // Re-attach all event handlers when client is recreated
    // (This is needed because event handlers are lost when creating a new client instance)
    
    client.on('qr', (qr) => {
        console.log('📱 QR Code generated. Please scan with WhatsApp.');
        qrcode.generate(qr, { small: true });
        clientState.qrCode = qr;
        clientState.isReady = false;
        clientState.isAuthenticated = false;
        client.emit('qr_ready', qr);
    });

    client.on('ready', async () => {
        console.log('✅ WhatsApp client is ready and connected!');
        try {
            const info = client.info;
            clientState.clientInfo = info;
            clientState.isReady = true;
            clientState.isAuthenticated = true;
            clientState.qrCode = null;
            clientState.lastSeen = new Date();
            clientState.connectionAttempts = 0;
            client.emit('client_ready', info);
        } catch (error) {
            console.error('❌ Error getting client info on ready:', error.message);
        }
    });

    // Add other event handlers as needed...
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
    
    try {
        if (client && !isClientDestroyed && client.getState) {
            clientStateInfo = client.getState();
        } else if (isClientDestroyed) {
            clientStateInfo = 'DESTROYED';
        } else if (!client) {
            clientStateInfo = 'NOT_INITIALIZED';
        }
    } catch (error) {
        // Ignore getState errors - client might not be ready
        clientStateInfo = 'ERROR';
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

// Export client and utilities
module.exports = {
    client,
    initializeWhatsApp,
    restartClient,
    shutdownClient,
    getClientHealth,
    clientState,
    createClient
}; 