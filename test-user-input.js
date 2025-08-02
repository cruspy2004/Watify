const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testExactUserInput() {
    console.log('🧪 Testing Exact User Input from Frontend\n');
    
    try {
        // Login with your credentials
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'haadheesheeraz2004@gmail.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.data.token;
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('✅ Login successful\n');

        // Test exactly what you entered in the frontend
        const exactUserData = {
            groupName: 'watify group',
            participants: ['923258660707', '923126604697']  // Split the comma-separated string
        };
        
        console.log('📝 Testing with your exact input:');
        console.log(`   Group Name: "${exactUserData.groupName}"`);
        console.log(`   Participants: ${exactUserData.participants.join(', ')}`);
        
        // Check if these are valid WhatsApp numbers first
        console.log('\n🔍 Checking if numbers are registered on WhatsApp...');
        
        for (const number of exactUserData.participants) {
            try {
                const checkResponse = await axios.post(`${BASE_URL}/whatsapp/check-number`, {
                    number: number
                }, { headers });
                console.log(`   ${number}: ${checkResponse.data.data.isRegistered ? '✅ Registered' : '❌ Not registered'}`);
            } catch (error) {
                console.log(`   ${number}: ⚠️ Could not check (${error.response?.status})`);
            }
        }
        
        // Test group creation
        console.log('\n🔧 Creating WhatsApp group...');
        
        try {
            const createResponse = await axios.post(
                `${BASE_URL}/whatsapp/groups/create`,
                exactUserData,
                { headers }
            );
            
            console.log('🎉 SUCCESS! Group created:');
            console.log(JSON.stringify(createResponse.data, null, 2));
            
        } catch (createError) {
            console.log('❌ GROUP CREATION FAILED');
            console.log('Status:', createError.response?.status);
            console.log('Error:', createError.response?.data);
            
            // Analyze the specific error
            if (createError.response?.data?.error) {
                const errorMsg = createError.response.data.error;
                
                if (errorMsg.includes('CreateGroupError')) {
                    console.log('\n🔍 WhatsApp Error Analysis:');
                    console.log('This is a WhatsApp-specific error. Possible causes:');
                    console.log('1. 📱 Numbers not in your WhatsApp contacts');
                    console.log('2. 🚫 Numbers not registered on WhatsApp');
                    console.log('3. ⏰ Rate limiting (too many attempts)');
                    console.log('4. 🔒 Account restrictions');
                    
                    console.log('\n💡 Solutions:');
                    console.log('- Add these numbers to your phone contacts first');
                    console.log('- Save contacts in WhatsApp');
                    console.log('- Wait 10-15 minutes before trying again');
                    console.log('- Try with numbers you regularly chat with');
                }
            }
        }
        
        // Test alternative: Check if you can message these numbers individually
        console.log('\n📤 Testing individual message sending...');
        
        for (const number of exactUserData.participants) {
            try {
                const messageResponse = await axios.post(`${BASE_URL}/whatsapp/send-message`, {
                    number: number,
                    message: 'Test message from Watify - checking if this number works'
                }, { headers });
                
                console.log(`   ✅ ${number}: Message sent successfully`);
                
            } catch (messageError) {
                console.log(`   ❌ ${number}: Message failed - ${messageError.response?.data?.message}`);
            }
        }
        
        // Show working alternative
        console.log('\n🔄 Alternative Approach:');
        console.log('Since you have 147 existing groups, try:');
        console.log('1. Create the group manually in WhatsApp');
        console.log('2. Add these contacts to the group');
        console.log('3. Use Watify to send messages to the group');
        console.log('4. Use Watify to manage the existing group');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
    }
}

testExactUserInput();
