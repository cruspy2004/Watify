const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = '';

// Test configuration
const testConfig = {
    // Replace with your actual phone numbers (international format without +)
    testParticipants: [
        '923001234567', // Replace with actual numbers
        '923331234567'  // Replace with actual numbers
    ],
    testGroupName: 'Watify Test Group'
};

async function authenticateUser() {
    try {
        console.log('🔐 Authenticating user...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'haadheesheeraz2004@gmail.com',
            password: 'admin123'
        });

        if (response.data.success) {
            authToken = response.data.data.token;
            console.log('✅ Authentication successful');
            return true;
        } else {
            console.log('❌ Authentication failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Authentication error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function checkWhatsAppStatus() {
    try {
        console.log('\n📱 Checking WhatsApp status...');
        const response = await axios.get(`${BASE_URL}/api/whatsapp/status`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const status = response.data.data;
        console.log('WhatsApp Status:', {
            isReady: status.isReady,
            isAuthenticated: status.isAuthenticated,
            state: status.state,
            hasQR: status.hasQR
        });

        return status.isReady;
    } catch (error) {
        console.error('❌ Status check error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function getExistingGroups() {
    try {
        console.log('\n📋 Getting existing WhatsApp groups...');
        const response = await axios.get(`${BASE_URL}/api/whatsapp/groups`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const data = response.data.data;
        console.log(`✅ Found ${data.groups.length} groups`);
        
        // Display first few groups
        data.groups.slice(0, 3).forEach((group, index) => {
            console.log(`${index + 1}. ${group.name} (${group.id})`);
        });

        return data.groups;
    } catch (error) {
        console.error('❌ Get groups error:', error.response?.data?.message || error.message);
        return [];
    }
}

async function getGroupDetails(groupId) {
    try {
        console.log(`\n🔍 Getting details for group: ${groupId}...`);
        const response = await axios.get(`${BASE_URL}/api/whatsapp/groups/${groupId}/info`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const groupInfo = response.data.data;
        console.log('✅ Group Details:', {
            name: groupInfo.name,
            description: groupInfo.description,
            participantCount: groupInfo.participantCount,
            createdAt: groupInfo.createdAt,
            adminCount: groupInfo.admins.length
        });

        return groupInfo;
    } catch (error) {
        console.error('❌ Get group details error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function createTestGroup() {
    try {
        console.log(`\n🔧 Creating test group: ${testConfig.testGroupName}...`);
        console.log(`👥 Participants: ${testConfig.testParticipants.join(', ')}`);
        
        const response = await axios.post(`${BASE_URL}/api/whatsapp/groups/create`, {
            groupName: testConfig.testGroupName,
            participants: testConfig.testParticipants
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const result = response.data.data;
        console.log('✅ Group created successfully!');
        console.log('Group ID:', result.groupId);
        console.log('Participants added:', result.participantCount);

        return result.groupId;
    } catch (error) {
        console.error('❌ Create group error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function sendTestMessage(groupId) {
    try {
        console.log(`\n📨 Sending test message to group: ${groupId}...`);
        
        const testMessage = `🎉 Hello from Watify!\n\nThis is a test message sent via our WhatsApp automation platform.\n\nTime: ${new Date().toLocaleString()}`;
        
        const response = await axios.post(`${BASE_URL}/api/whatsapp/groups/${groupId}/send-message`, {
            message: testMessage
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const result = response.data.data;
        console.log('✅ Message sent successfully!');
        console.log('Message ID:', result.messageId);

        return result;
    } catch (error) {
        console.error('❌ Send message error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function getGroupInviteLink(groupId) {
    try {
        console.log(`\n🔗 Getting invite link for group: ${groupId}...`);
        
        const response = await axios.get(`${BASE_URL}/api/whatsapp/groups/${groupId}/invite`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const result = response.data.data;
        console.log('✅ Invite link generated!');
        console.log('Invite Link:', result.inviteLink);

        return result.inviteLink;
    } catch (error) {
        console.error('❌ Get invite link error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function addParticipantsTest(groupId) {
    try {
        console.log(`\n👥 Adding additional participants to group: ${groupId}...`);
        
        // Add more test numbers (replace with actual numbers)
        const additionalParticipants = [
            '923451234567' // Replace with actual number
        ];
        
        const response = await axios.post(`${BASE_URL}/api/whatsapp/groups/${groupId}/participants/add`, {
            participants: additionalParticipants
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const result = response.data.data;
        console.log('✅ Participants added successfully!');
        console.log('Added:', result.addedParticipants);

        return result;
    } catch (error) {
        console.error('❌ Add participants error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function runFullTest() {
    console.log('🚀 Starting Real WhatsApp Integration Test\n');
    console.log('⚠️  IMPORTANT: Make sure you have:');
    console.log('   1. Updated test phone numbers in testConfig');
    console.log('   2. WhatsApp client is authenticated (QR scanned)');
    console.log('   3. Backend server is running\n');

    // Step 1: Authenticate
    const authSuccess = await authenticateUser();
    if (!authSuccess) {
        console.log('❌ Test failed: Authentication required');
        return;
    }

    // Step 2: Check WhatsApp status
    const isReady = await checkWhatsAppStatus();
    if (!isReady) {
        console.log('❌ Test failed: WhatsApp not ready. Please scan QR code first.');
        return;
    }

    // Step 3: Get existing groups
    const existingGroups = await getExistingGroups();
    
    // Step 4: Get details of first group (if any)
    if (existingGroups.length > 0) {
        await getGroupDetails(existingGroups[0].id);
    }

    // Step 5: Create test group
    console.log('\n⚠️  WARNING: This will create a REAL WhatsApp group!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const newGroupId = await createTestGroup();
    if (!newGroupId) {
        console.log('❌ Test failed: Could not create group');
        return;
    }

    // Step 6: Send test message
    await sendTestMessage(newGroupId);

    // Step 7: Get invite link
    await getGroupInviteLink(newGroupId);

    // Step 8: Get updated group details
    await getGroupDetails(newGroupId);

    console.log('\n🎉 Real WhatsApp Integration Test Completed!');
    console.log('✅ All WhatsApp operations were performed on actual WhatsApp');
    console.log('📱 Check your WhatsApp mobile app to see the results');
}

// Handle command line arguments
if (process.argv.includes('--run')) {
    runFullTest().catch(console.error);
} else {
    console.log('Real WhatsApp Integration Test');
    console.log('==============================');
    console.log('');
    console.log('This script tests REAL WhatsApp operations:');
    console.log('• Creating actual WhatsApp groups');
    console.log('• Adding real participants');
    console.log('• Sending real messages');
    console.log('• Getting group information');
    console.log('');
    console.log('⚠️  CAUTION: This will create real groups and send real messages!');
    console.log('');
    console.log('Before running:');
    console.log('1. Update testConfig with real phone numbers');
    console.log('2. Make sure WhatsApp client is authenticated');
    console.log('3. Start backend server (npm run dev:backend)');
    console.log('');
    console.log('To run the test: node test-real-whatsapp-integration.js --run');
}

module.exports = {
    authenticateUser,
    checkWhatsAppStatus,
    getExistingGroups,
    getGroupDetails,
    createTestGroup,
    sendTestMessage,
    getGroupInviteLink,
    addParticipantsTest
};
