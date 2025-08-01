const https = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 Wateen Watify - API Testing Suite');
  console.log('====================================\n');

  const baseURL = 'http://localhost:5000';
  let authToken = null;

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check Endpoint...');
    const healthResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    });
    
    console.log(`   Status: ${healthResult.statusCode} ${healthResult.statusMessage}`);
    console.log(`   Response:`, healthResult.data);
    console.log(`   ✅ Health check ${healthResult.statusCode === 200 ? 'PASSED' : 'FAILED'}\n`);

    // Test 2: Welcome Endpoint
    console.log('2️⃣ Testing Welcome Endpoint...');
    const welcomeResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET'
    });
    
    console.log(`   Status: ${welcomeResult.statusCode} ${welcomeResult.statusMessage}`);
    console.log(`   Response:`, welcomeResult.data);
    console.log(`   ✅ Welcome endpoint ${welcomeResult.statusCode === 200 ? 'PASSED' : 'FAILED'}\n`);

    // Test 3: User Registration
    console.log('3️⃣ Testing User Registration...');
    const registrationData = {
      name: 'Test User',
      email: 'testuser@wateen.com',
      password: 'password123'
    };

    const registerResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(registrationData).length
      }
    }, registrationData);

    console.log(`   Status: ${registerResult.statusCode} ${registerResult.statusMessage}`);
    console.log(`   Response:`, registerResult.data);
    
    if (registerResult.statusCode === 201 && registerResult.data?.data?.token) {
      authToken = registerResult.data.data.token;
      console.log(`   🔑 JWT Token received: ${authToken.substring(0, 50)}...`);
      console.log(`   ✅ Registration PASSED\n`);
    } else {
      console.log(`   ❌ Registration FAILED\n`);
    }

    // Test 4: User Login
    console.log('4️⃣ Testing User Login...');
    const loginData = {
      email: 'testuser@wateen.com',
      password: 'password123'
    };

    const loginResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(loginData).length
      }
    }, loginData);

    console.log(`   Status: ${loginResult.statusCode} ${loginResult.statusMessage}`);
    console.log(`   Response:`, loginResult.data);
    
    if (loginResult.statusCode === 200 && loginResult.data?.data?.token) {
      authToken = loginResult.data.data.token; // Update token
      console.log(`   🔑 New JWT Token: ${authToken.substring(0, 50)}...`);
      console.log(`   ✅ Login PASSED\n`);
    } else {
      console.log(`   ❌ Login FAILED\n`);
    }

    // Test 5: Protected Profile Endpoint
    if (authToken) {
      console.log('5️⃣ Testing Protected Profile Endpoint...');
      const profileResult = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${profileResult.statusCode} ${profileResult.statusMessage}`);
      console.log(`   Response:`, profileResult.data);
      console.log(`   ✅ Profile endpoint ${profileResult.statusCode === 200 ? 'PASSED' : 'FAILED'}\n`);
    } else {
      console.log('5️⃣ ⏭️  Skipping Profile test (no auth token)\n');
    }

    // Test 6: Error Testing - Invalid Registration
    console.log('6️⃣ Testing Error Handling - Invalid Registration...');
    const invalidData = {
      name: '',
      email: 'invalid-email',
      password: '123'
    };

    const invalidResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(invalidData).length
      }
    }, invalidData);

    console.log(`   Status: ${invalidResult.statusCode} ${invalidResult.statusMessage}`);
    console.log(`   Response:`, invalidResult.data);
    console.log(`   ✅ Error handling ${invalidResult.statusCode === 400 ? 'PASSED' : 'FAILED'}\n`);

    // Test 7: Unauthorized Access
    console.log('7️⃣ Testing Unauthorized Access...');
    const unauthorizedResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${unauthorizedResult.statusCode} ${unauthorizedResult.statusMessage}`);
    console.log(`   Response:`, unauthorizedResult.data);
    console.log(`   ✅ Unauthorized access ${unauthorizedResult.statusCode === 403 || unauthorizedResult.statusCode === 401 ? 'PASSED' : 'FAILED'}\n`);

    console.log('🎉 API Testing Complete!');
    console.log('========================');

  } catch (error) {
    console.error('❌ API Testing failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI }; 