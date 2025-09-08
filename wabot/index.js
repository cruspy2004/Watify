// Import the WhatsApp client
const { Client } = require('whatsapp-web.js');

// For displaying QR code in terminal
const qrcode = require('qrcode-terminal');

// Create a new WhatsApp client
const client = new Client();

// Listen for QR code event
client.on('qr', (qr) => {
  // Print QR code in terminal so you can scan with your phone
  qrcode.generate(qr, { small: true });
});

// Once client is ready, log that it's ready
client.on('ready', () => {
  console.log('✅ Client is ready!');
});

// Listen for incoming messages
client.on('message', msg => {
  // Log the message in console
  console.log(`📩 Message received: ${msg.body}`);

  // If the message is '!ping', reply with 'Pong!'
  if (msg.body === '!ping') {
    msg.reply('Pong!');
  }
});

// Start the client
client.initialize();
