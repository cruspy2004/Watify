const { client, getClientHealth, restartClient } = require('../config/whatsapp');
const QRCode = require('qrcode');

class WhatsAppService {
    constructor() {
        this.qrCodeData = null;
        this.isReady = false;
        this.connectionState = 'DISCONNECTED';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Use the enhanced event handlers from the client config
        client.on('qr_ready', (qr) => {
            console.log('📱 QR Code ready in service');
            this.qrCodeData = qr;
            this.isReady = false;
            this.connectionState = 'QR_READY';
        });

        client.on('client_ready', (info) => {
            console.log('✅ Client ready in service');
            this.isReady = true;
            this.qrCodeData = null;
            this.connectionState = 'CONNECTED';
        });

        client.on('client_authenticated', () => {
            console.log('🔐 Client authenticated in service');
            this.connectionState = 'AUTHENTICATED';
        });

        client.on('auth_failed', (msg) => {
            console.error(' Authentication failed in service:', msg);
            this.isReady = false;
            this.connectionState = 'AUTH_FAILED';
        });

        client.on('client_disconnected', (reason) => {
            console.log(' Client disconnected in service:', reason);
            this.isReady = false;
            this.connectionState = 'DISCONNECTED';
        });

        client.on('state_changed', (state) => {
            console.log(' State changed in service:', state);
            this.connectionState = state;
        });

        client.on('client_error', (error) => {
            console.error(' Client error in service:', error);
            this.connectionState = 'ERROR';
        });

        // Handle incoming messages
        client.on('incoming_message', async (message) => {
            await this.handleIncomingMessage(message);
        });

        client.on('message_received', async (data) => {
            await this.handleMessageReceived(data);
        });

        // Handle group events
        client.on('group_member_added', (notification) => {
            this.handleGroupMemberAdded(notification);
        });

        client.on('group_member_removed', (notification) => {
            this.handleGroupMemberRemoved(notification);
        });
    }

    /**
     * Execute operation with retry logic for session errors
     */
    async executeWithRetry(operation, maxRetries = 3, operationName = 'operation') {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                // Check if it's a session closed error
                if (error.message && error.message.includes('Session closed')) {
                    console.log(`⚠️ Session closed during ${operationName} (attempt ${attempt}/${maxRetries})`);
                    
                    if (attempt < maxRetries) {
                        // Wait before retry
                        const delay = Math.min(1000 * attempt, 5000);
                        console.log(`🔄 Retrying ${operationName} in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        
                        // Check if client is still ready
                        const health = getClientHealth();
                        if (!health.isReady || health.sessionClosed) {
                            console.log(`🔄 Client not ready, triggering restart...`);
                            await this.restart();
                            // Wait for restart to complete
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                        continue;
                    }
                }
                
                // For non-session errors, throw immediately
                if (!error.message || !error.message.includes('Session closed')) {
                    throw error;
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Handle incoming messages - can be extended for auto-responses or logging
     */
    async handleIncomingMessage(message) {
        try {
            // Log incoming message to database or handle auto-responses
            console.log(`Processing incoming message: ${message.body}`);
            
            // Add your custom logic here for handling incoming messages
            // For example: save to database, trigger webhooks, etc.
            
        } catch (error) {
            console.error(' Error handling incoming message:', error);
        }
    }

    /**
     * Handle received messages with contact info
     */
    async handleMessageReceived(data) {
        try {
            const { message, contact } = data;
            console.log(` Processing message from ${contact.pushname || contact.number}`);
            
            // Add your custom logic here
            // For example: customer support automation, etc.
            
        } catch (error) {
            console.error(' Error handling received message:', error);
        }
    }

    /**
     * Handle group member added events
     */
    handleGroupMemberAdded(notification) {
        try {
            console.log(' Group member added:', notification);
            // Add your custom logic here
        } catch (error) {
            console.error(' Error handling group member added:', error);
        }
    }

    /**
     * Handle group member removed events
     */
    handleGroupMemberRemoved(notification) {
        try {
            console.log(' Group member removed:', notification);
            // Add your custom logic here
        } catch (error) {
            console.error(' Error handling group member removed:', error);
        }
    }

    /**
     * Get QR code as base64 data URL
     */
    async getQRCode() {
        try {
            if (!this.qrCodeData) {
                return null;
            }

            // Generate QR code as data URL
            const qrCodeDataURL = await QRCode.toDataURL(this.qrCodeData, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            return qrCodeDataURL;
        } catch (error) {
            console.error(' Error generating QR code:', error);
            throw error;
        }
    }

    /**
     * Get QR code as SVG string
     */
    async getQRCodeSVG() {
        try {
            if (!this.qrCodeData) {
                return null;
            }

            const qrCodeSVG = await QRCode.toString(this.qrCodeData, {
                type: 'svg',
                width: 256,
                margin: 2
            });

            return qrCodeSVG;
        } catch (error) {
            console.error(' Error generating QR code SVG:', error);
            throw error;
        }
    }

    /**
     * Send a message to a specific WhatsApp number with retry logic
     * @param {string} number - Phone number in international format (e.g., "1XXXXXXXXXX")
     * @param {string} message - Text message to send
     * @param {Object} options - Additional options for message sending
     */
    async sendMessage(number, message, options = {}) {
        return await this.executeWithRetry(async () => {
            console.log(` [DEBUG] Starting sendMessage to ${number}`);
            console.log(` [DEBUG] isReady: ${this.isReady}`);
            console.log(` [DEBUG] connectionState: ${this.connectionState}`);
            
            // Check client state more thoroughly
            try {
                const clientState = await client.getState();
                console.log(` [DEBUG] Client state: ${clientState}`);
            } catch (stateError) {
                console.log(` [DEBUG] Could not get client state: ${stateError.message}`);
            }
            
            // Temporarily bypass isReady check for debugging
            if (!this.isReady || this.connectionState !== 'CONNECTED') {
                console.log(` [WARNING] WhatsApp not ready: isReady=${this.isReady}, state=${this.connectionState}`);
                console.log(` [DEBUG] Attempting to send anyway for debugging...`);
                // Commented out to bypass the check temporarily
                // throw new Error(`WhatsApp client is not ready. State: ${this.connectionState}, Ready: ${this.isReady}`);
            }

            // Ensure number is in correct format (remove any spaces or special characters)
            const sanitizedNumber = number.replace(/[^\d]/g, '');
            const chatId = `${sanitizedNumber}@c.us`;
            
            console.log(` [DEBUG] Sanitized number: ${sanitizedNumber}`);
            console.log(` [DEBUG] Chat ID: ${chatId}`);
            
            // Check if the number is registered on WhatsApp first
            console.log(` [DEBUG] Checking if number is registered...`);
            try {
                const isRegistered = await client.isRegisteredUser(chatId);
                console.log(` [DEBUG] Number registration status: ${isRegistered}`);
                
                if (!isRegistered) {
                    console.log(` [WARNING] Number not registered, but continuing anyway...`);
                    // throw new Error(`Number ${number} is not registered on WhatsApp`);
                }
            } catch (regError) {
                console.log(` [DEBUG] Registration check failed: ${regError.message}`);
                // Continue anyway - might be a temporary issue
            }
            
            // Send message with options
            console.log(` [DEBUG] Attempting to send message...`);
            console.log(` [DEBUG] Message content: "${message}"`);
            
            try {
                const response = await client.sendMessage(chatId, message, options);
                console.log(` [DEBUG] Send response received:`, {
                    hasResponse: !!response,
                    hasId: !!(response && response.id),
                    id: response?.id?._serialized,
                    timestamp: response?.timestamp,
                    ack: response?.ack
                });
                
                // Validate response
                if (!response) {
                    throw new Error('Failed to send message - no response received');
                }
                
                if (!response.id) {
                    throw new Error('Failed to send message - response has no ID');
                }
                
                console.log(` Message sent to ${number}: ${message.substring(0, 50)}...`);
                console.log(` Message ID: ${response.id._serialized}`);
                console.log(` Acknowledgment: ${response.ack}`);
                
                return {
                    success: true,
                    messageId: response.id._serialized,
                    timestamp: response.timestamp,
                    to: number,
                    body: message,
                    chatId: chatId,
                    ack: response.ack
                };
                
            } catch (sendError) {
                console.error(` [ERROR] Primary send failed: ${sendError.message}`);
                
                // Try alternative chat ID format
                console.log(` [DEBUG] Trying alternative chat ID format...`);
                const altChatId = `${sanitizedNumber}@s.whatsapp.net`;
                console.log(` [DEBUG] Alternative Chat ID: ${altChatId}`);
                
                try {
                    const altResponse = await client.sendMessage(altChatId, message, options);
                    console.log(` [DEBUG] Alternative send response:`, {
                        hasResponse: !!altResponse,
                        hasId: !!(altResponse && altResponse.id),
                        id: altResponse?.id?._serialized
                    });
                    
                    if (altResponse && altResponse.id) {
                        console.log(` Message sent with alternative format to ${number}`);
                        return {
                            success: true,
                            messageId: altResponse.id._serialized,
                            timestamp: altResponse.timestamp,
                            to: number,
                            body: message,
                            chatId: altChatId,
                            ack: altResponse.ack
                        };
                    }
                } catch (altError) {
                    console.error(` [ERROR] Alternative format also failed: ${altError.message}`);
                }
                
                // If both formats fail, throw the original error
                throw new Error(`Message sending failed: ${sendError.message}`);
            }
            
        }, 3, `sendMessage to ${number}`);
    }

    /**
     * Send a message with media attachment
     * @param {string} number - Phone number
     * @param {Object} media - Media object with data and filename
     * @param {string} caption - Optional caption for the media
     */
    async sendMediaMessage(number, media, caption = '') {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            const sanitizedNumber = number.replace(/[^\d]/g, '');
            const chatId = `${sanitizedNumber}@c.us`;
            
            // Check if the number is registered
            const isRegistered = await client.isRegisteredUser(chatId);
            if (!isRegistered) {
                throw new Error(`Number ${number} is not registered on WhatsApp`);
            }

            const response = await client.sendMessage(chatId, media, { caption });
            
            console.log(` Media message sent to ${number}`);
            
            return {
                success: true,
                messageId: response.id._serialized,
                timestamp: response.timestamp,
                to: number,
                type: 'media'
            };
            
        }, 3, `sendMediaMessage to ${number}`);
    }

    /**
     * Send a message to multiple numbers with rate limiting and error handling
     * @param {string[]} numbers - Array of phone numbers
     * @param {string} message - Text message to send
     * @param {Object} options - Options including delay between messages
     */
    async sendBulkMessages(numbers, message, options = {}) {
        const { delay = 2000, skipInvalid = true, maxConcurrent = 1 } = options;
        const results = [];
        
        console.log(` Starting bulk message send to ${numbers.length} numbers...`);
        
        // Process messages one by one to avoid rate limiting and session issues
        for (let i = 0; i < numbers.length; i++) {
            const number = numbers[i];
            
            try {
                console.log(` Sending message ${i + 1}/${numbers.length} to ${number}...`);
                
                const result = await this.sendMessage(number, message);
                results.push({ 
                    number, 
                    success: true, 
                    result,
                    index: i 
                });
                
                console.log(` Bulk message ${i + 1}/${numbers.length} sent to ${number}`);
                
            } catch (error) {
                console.error(` Bulk message ${i + 1}/${numbers.length} failed for ${number}:`, error.message);
                
                results.push({ 
                    number, 
                    success: false, 
                    error: error.message,
                    index: i 
                });
                
                // If skipInvalid is false and we hit an error, stop the process
                if (!skipInvalid) {
                    console.log(' Stopping bulk send due to error (skipInvalid=false)');
                    break;
                }
                
                // If it's a session error, wait longer before continuing
                if (error.message && error.message.includes('Session closed')) {
                    console.log(' Session error detected, waiting longer before next message...');
                    await new Promise(resolve => setTimeout(resolve, delay * 2));
                }
            }
            
            // Add delay between messages to avoid rate limiting (except for last message)
            if (i < numbers.length - 1) {
                console.log(`⏸ Waiting ${delay}ms before next message...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Check client health between messages
                const health = getClientHealth();
                if (!health.isReady || health.sessionClosed) {
                    console.log(' Client not ready during bulk send, pausing...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(` Bulk message results: ${successful} successful, ${failed} failed`);
        
        return {
            total: numbers.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Check if a number is registered on WhatsApp with retry logic
     * @param {string} number - Phone number to check
     */
    async isRegisteredUser(number) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            const sanitizedNumber = number.replace(/[^\d]/g, '');
            const chatId = `${sanitizedNumber}@c.us`;
            const isRegistered = await client.isRegisteredUser(chatId);
            
            return {
                number,
                isRegistered,
                chatId
            };
            
        }, 3, `isRegisteredUser for ${number}`);
    }

    /**
     * Get all chats with retry logic
     */
    async getChats() {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            const chats = await client.getChats();
            return chats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name,
                isGroup: chat.isGroup,
                unreadCount: chat.unreadCount,
                timestamp: chat.timestamp,
                lastMessage: chat.lastMessage
            }));
            
        }, 3, 'getChats');
    }

    /**
     * Get detailed group information including participants
     * @param {string} groupId - WhatsApp group ID
     */
    async getGroupInfo(groupId) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            const chat = await client.getChatById(groupId);
            
            if (!chat.isGroup) {
                throw new Error('Chat ID is not a group');
            }

            // Get participants with their details
            const participants = chat.participants.map(participant => ({
                id: participant.id._serialized,
                isAdmin: participant.isAdmin,
                isSuperAdmin: participant.isSuperAdmin
            }));

            // Get group metadata
            return {
                id: chat.id._serialized,
                name: chat.name,
                description: chat.description || '',
                participants: participants,
                participantCount: participants.length,
                createdAt: chat.createdAt ? new Date(chat.createdAt * 1000) : null,
                owner: chat.owner ? chat.owner._serialized : null,
                isGroup: true,
                admins: participants.filter(p => p.isAdmin || p.isSuperAdmin),
                invite: null // Will be populated if invite link is available
            };
            
        }, 3, `getGroupInfo for ${groupId}`);
    }

    /**
     * Create a new WhatsApp group
     * @param {string} groupName - Name of the group
     * @param {string[]} participantNumbers - Array of phone numbers to add
     */
    async createWhatsAppGroup(groupName, participantNumbers) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            // Validate group name
            if (!groupName || groupName.trim().length === 0) {
                throw new Error('Group name is required');
            }

            if (groupName.length > 25) {
                throw new Error('Group name cannot exceed 25 characters');
            }

            // Validate participants
            if (!participantNumbers || !Array.isArray(participantNumbers) || participantNumbers.length === 0) {
                throw new Error('At least one participant is required');
            }

            // Format participant numbers as chat IDs
            const participantChatIds = participantNumbers.map(number => {
                const sanitized = number.replace(/[^\d]/g, '');
                return `${sanitized}@c.us`;
            });

            console.log(`🔧 Creating WhatsApp group: ${groupName}`);
            console.log(`👥 Participants: ${participantChatIds.length}`);

            // Create the group
            const group = await client.createGroup(groupName.trim(), participantChatIds);

            console.log(`✅ Group created successfully: ${group.gid._serialized}`);

            return {
                success: true,
                groupId: group.gid._serialized,
                groupName: groupName.trim(),
                participants: participantChatIds,
                participantCount: participantChatIds.length,
                createdAt: new Date()
            };
            
        }, 3, `createWhatsAppGroup: ${groupName}`);
    }

    /**
     * Add participants to an existing WhatsApp group
     * @param {string} groupId - WhatsApp group ID
     * @param {string[]} participantNumbers - Array of phone numbers to add
     */
    async addParticipantsToGroup(groupId, participantNumbers) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            // Validate inputs
            if (!groupId) {
                throw new Error('Group ID is required');
            }

            if (!participantNumbers || !Array.isArray(participantNumbers) || participantNumbers.length === 0) {
                throw new Error('At least one participant number is required');
            }

            // Format participant numbers as chat IDs
            const participantChatIds = participantNumbers.map(number => {
                const sanitized = number.replace(/[^\d]/g, '');
                return `${sanitized}@c.us`;
            });

            console.log(`👥 Adding ${participantChatIds.length} participants to group ${groupId}`);

            // Get the group chat
            const chat = await client.getChatById(groupId);
            
            if (!chat.isGroup) {
                throw new Error('Chat ID is not a group');
            }

            // Add participants
            const results = await chat.addParticipants(participantChatIds);

            console.log(`✅ Participants added to group`);

            return {
                success: true,
                groupId: groupId,
                addedParticipants: participantChatIds,
                results: results,
                timestamp: new Date()
            };
            
        }, 3, `addParticipantsToGroup: ${groupId}`);
    }

    /**
     * Remove participants from a WhatsApp group
     * @param {string} groupId - WhatsApp group ID
     * @param {string[]} participantNumbers - Array of phone numbers to remove
     */
    async removeParticipantsFromGroup(groupId, participantNumbers) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            // Validate inputs
            if (!groupId) {
                throw new Error('Group ID is required');
            }

            if (!participantNumbers || !Array.isArray(participantNumbers) || participantNumbers.length === 0) {
                throw new Error('At least one participant number is required');
            }

            // Format participant numbers as chat IDs
            const participantChatIds = participantNumbers.map(number => {
                const sanitized = number.replace(/[^\d]/g, '');
                return `${sanitized}@c.us`;
            });

            console.log(`👥 Removing ${participantChatIds.length} participants from group ${groupId}`);

            // Get the group chat
            const chat = await client.getChatById(groupId);
            
            if (!chat.isGroup) {
                throw new Error('Chat ID is not a group');
            }

            // Remove participants
            const results = await chat.removeParticipants(participantChatIds);

            console.log(`✅ Participants removed from group`);

            return {
                success: true,
                groupId: groupId,
                removedParticipants: participantChatIds,
                results: results,
                timestamp: new Date()
            };
            
        }, 3, `removeParticipantsFromGroup: ${groupId}`);
    }

    /**
     * Send message to a WhatsApp group
     * @param {string} groupId - WhatsApp group ID
     * @param {string} message - Message to send
     */
    async sendGroupMessage(groupId, message) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            const response = await client.sendMessage(groupId, message);
            
            console.log(`📨 Message sent to group ${groupId}`);
            
            return {
                success: true,
                messageId: response.id._serialized,
                timestamp: response.timestamp,
                groupId: groupId,
                body: message,
                ack: response.ack
            };
            
        }, 3, `sendGroupMessage to ${groupId}`);
    }

    /**
     * Get group invite link
     * @param {string} groupId - WhatsApp group ID
     */
    async getGroupInviteLink(groupId) {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready. Please authenticate first.');
            }

            const chat = await client.getChatById(groupId);
            
            if (!chat.isGroup) {
                throw new Error('Chat ID is not a group');
            }

            const inviteCode = await chat.getInviteCode();
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

            console.log(`🔗 Generated invite link for group ${groupId}`);

            return {
                success: true,
                groupId: groupId,
                inviteCode: inviteCode,
                inviteLink: inviteLink,
                timestamp: new Date()
            };
            
        }, 3, `getGroupInviteLink for ${groupId}`);
    }

    /**
     * Get connection state with enhanced health information
     */
    getState() {
        const health = getClientHealth();
        
        return {
            state: this.connectionState,
            isReady: this.isReady,
            hasQR: !!this.qrCodeData,
            ...health
        };
    }

    /**
     * Restart the WhatsApp client using the enhanced restart function
     */
    async restart() {
        try {
            console.log(' Restarting WhatsApp client from service...');
            
            // Reset service state
            this.isReady = false;
            this.qrCodeData = null;
            this.connectionState = 'RESTARTING';
            
            // Use the enhanced restart function from config
            await restartClient();
            
            // Wait for restart to complete
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds max wait
            
            while (attempts < maxAttempts) {
                const health = getClientHealth();
                if (health.isReady || health.hasQR) {
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            
            console.log('✅ WhatsApp client restarted successfully from service');
            
        } catch (error) {
            console.error(' Error restarting WhatsApp client from service:', error);
            this.connectionState = 'ERROR';
            throw error;
        }
    }

    /**
     * Get client info with additional details and retry logic
     */
    async getClientInfo() {
        return await this.executeWithRetry(async () => {
            if (!this.isReady) {
                return null;
            }
            
            const health = getClientHealth();
            const info = client.info;
            
            return {
                ...info,
                health,
                connectionState: this.connectionState
            };
            
        }, 2, 'getClientInfo');
    }

    /**
     * Get service statistics
     */
    getServiceStats() {
        const health = getClientHealth();
        
        return {
            isReady: this.isReady,
            connectionState: this.connectionState,
            hasQR: !!this.qrCodeData,
            uptime: health.lastSeen ? Date.now() - new Date(health.lastSeen).getTime() : null,
            ...health
        };
    }

    /**
     * Perform health check with diagnostics
     */
    async performHealthCheck() {
        try {
            const health = getClientHealth();
            const stats = this.getServiceStats();
            
            // Basic connectivity test
            let connectivityTest = 'unknown';
            if (health.isReady && !health.sessionClosed) {
                try {
                    // Try to get state as a simple connectivity test
                    const state = client.getState();
                    connectivityTest = state === 'CONNECTED' ? 'pass' : 'warning';
                } catch (error) {
                    connectivityTest = error.message.includes('Session closed') ? 'session_closed' : 'fail';
                }
            } else {
                connectivityTest = 'not_ready';
            }
            
            return {
                timestamp: new Date().toISOString(),
                overall: health.isReady && !health.sessionClosed ? 'healthy' : 'unhealthy',
                connectivity: connectivityTest,
                health,
                stats,
                recommendations: this.getHealthRecommendations(health, connectivityTest)
            };
            
        } catch (error) {
            return {
                timestamp: new Date().toISOString(),
                overall: 'error',
                error: error.message,
                recommendations: ['Check logs for detailed error information', 'Consider restarting the client']
            };
        }
    }

    /**
     * Get health recommendations based on current state
     */
    getHealthRecommendations(health, connectivityTest) {
        const recommendations = [];
        
        if (!health.isReady) {
            recommendations.push('Client is not ready - ensure QR code is scanned if available');
        }
        
        if (health.sessionClosed) {
            recommendations.push('Session is closed - restart may be needed');
        }
        
        if (health.connectionAttempts > 0) {
            recommendations.push(`${health.connectionAttempts} connection attempts made - monitor for stability`);
        }
        
        if (connectivityTest === 'session_closed') {
            recommendations.push('Session closed detected - automatic restart should occur');
        }
        
        if (health.hasQR) {
            recommendations.push('QR code available - scan with WhatsApp to authenticate');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('All systems operating normally');
        }
        
        return recommendations;
    }
}

module.exports = new WhatsAppService(); 