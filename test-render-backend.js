// Quick Backend Test Script
// Run this to verify your Render backend is working

const RENDER_URL = 'https://watify.onrender.com'; // UPDATE THIS WITH YOUR ACTUAL RENDER URL

async function testBackend() {
  console.log('🧪 Testing Render Backend...\n');
  console.log('Backend URL:', RENDER_URL);
  console.log('=' .repeat(50) + '\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const healthResponse = await fetch(`${RENDER_URL}/health`);
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ Health check PASSED');
      console.log('   Response:', data);
    } else {
      console.log('❌ Health check FAILED');
      console.log('   Status:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health check ERROR:', error.message);
  }
  console.log('');

  // Test 2: Welcome Endpoint
  console.log('2️⃣ Testing Welcome Endpoint...');
  try {
    const welcomeResponse = await fetch(`${RENDER_URL}/`);
    if (welcomeResponse.ok) {
      const data = await welcomeResponse.json();
      console.log('✅ Welcome endpoint PASSED');
      console.log('   Response:', data);
    } else {
      console.log('❌ Welcome endpoint FAILED');
      console.log('   Status:', welcomeResponse.status);
    }
  } catch (error) {
    console.log('❌ Welcome endpoint ERROR:', error.message);
  }
  console.log('');

  // Test 3: Login Endpoint
  console.log('3️⃣ Testing Login Endpoint...');
  try {
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'haadheesheeraz2004@gmail.com',
        password: 'admin@123'
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Login PASSED');
      console.log('   User:', data.data?.user?.email);
      console.log('   Has Token:', !!data.data?.token);
    } else {
      const errorData = await loginResponse.json().catch(() => ({}));
      console.log('❌ Login FAILED');
      console.log('   Status:', loginResponse.status);
      console.log('   Error:', errorData);
    }
  } catch (error) {
    console.log('❌ Login ERROR:', error.message);
  }
  console.log('');

  console.log('=' .repeat(50));
  console.log('✨ Test Complete!\n');
  console.log('📝 Summary:');
  console.log('   - If all tests passed: Your backend is working! ✅');
  console.log('   - If health/welcome fail: Check Render URL and deployment');
  console.log('   - If login fails: Check Supabase database and credentials');
}

// Run the tests
testBackend();
