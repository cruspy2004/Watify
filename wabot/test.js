
// For displaying QR code in terminal
const qrcode = require('qrcode-terminal');


const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('Scan this QR code to log in:\n', qr);
});

client.on('ready', async () => {
    console.log('Client is ready!');

    // List of participant phone numbers in international format (with @c.us)
    const participants = [
        '923258660707@c.us',  // replace with real numbers
        '923126604697@c.us'
    ];

    try {
        const group = await client.createGroup('My Gang Chat 💥', participants);
        console.log(`Group created! ID: ${group.gid._serialized}`);
    } catch (err) {
        console.error('Failed to create group:', err);
    }
});

client.initialize();
