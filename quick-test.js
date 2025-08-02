const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function quickTest() {
    console.log('🔍 Quick WhatsApp API Test\n');
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server connection...');
        const serverResponse = await axios.get(`${BASE_URL}/whatsapp/debug/status`);
        console.log('✅ Server is running');
        console.log(`   WhatsApp Ready: ${serverResponse.data.data.state.isReady}`);
        console.log(`   Has QR: ${serverResponse.data.data.state.hasQR}\n`);
        
        // Test 2: Login
        console.log('2. Testing login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'haadheesheeraz2004@gmail.com',
            password: 'admin123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful');
            const token = loginResponse.data.data.token;
            
            // Test 3: Get WhatsApp status with auth
            console.log('\n3. Getting authenticated WhatsApp status...');
            const statusResponse = await axios.get(`${BASE_URL}/whatsapp/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log(`   Status: ${statusResponse.data.data.state || 'Unknown'}`);
            console.log(`   Ready: ${statusResponse.data.data.isReady}`);
            console.log(`   Authenticated: ${statusResponse.data.data.isAuthenticated}`);
            
            if (!statusResponse.data.data.isReady) {
                console.log('\n⚠️  WhatsApp not ready. Need to scan QR code first.');
                
                // Try to get QR
                try {
                    const qrResponse = await axios.get(`${BASE_URL}/whatsapp/qr`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('📱 QR code is available for scanning');
                } catch (qrError) {
                    console.log('❌ QR code not available');
                }
                return;
            }
            
            // Test 4: Try group creation
            console.log('\n4. Testing group creation...');
            console.log('📝 Creating group: "Watify API Test Group"');
            console.log('👥 Participants: ["923258660707"]');
            
            const groupResponse = await axios.post(`${BASE_URL}/whatsapp/groups/create`, {
                groupName: 'Watify API Test Group',
                participants: ['923258660707']
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('🎉 Group creation response:');
            console.log(JSON.stringify(groupResponse.data, null, 2));
            
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
        }
        
    } catch (error) {
        console.error('\n❌ Test Error:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('❌ Cannot connect to server. Is the backend running on port 5001?');
            console.error('💡 Run: npm run dev:backend');
        } else {
            console.error(error.message);
        }
    }
}

quickTest();
