// Import required packages
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// Initialize client with persistent auth
const client = new Client({
    authStrategy: new LocalAuth()
});

// Display QR in terminal when needed
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// When client is ready
client.on('ready', async () => {
    console.log('Client is ready!');

    // List of participants – use international format and add '@c.us'
    const participants = [
        '923258660707@c.us',
        '923126604697@c.us'
        // Add more if needed
    ];

    try {
        // Create group and get the Chat object
        const groupChat = await client.createGroup('My Gang Chat 💥', participants);

        // Show the group ID
        console.log(`✅ Group created! `);

        // Send welcome message
        await client.sendMessage(groupChat.id._serialized, '🔥 Welcome to the gang!');
    } catch (err) {
        console.error('❌ Failed to create group:', err);
    }
});

// Start the client
client.initialize();
