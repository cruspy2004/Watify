import { apiService } from '../services/api';
import { API_CONFIG } from './config';

/**
 * Test the connection between frontend and backend
 */
export const testConnection = async () => {
  const results = {
    healthCheck: false,
    welcomeEndpoint: false,
    timestamp: new Date().toISOString(),
    errors: []
  };

  try {
    // Test health endpoint
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      results.healthCheck = true;
      console.log('✅ Health check passed:', healthData);
    } else {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    results.errors.push(`Health check: ${error.message}`);
  }

  try {
    // Test welcome endpoint
    console.log('🔍 Testing welcome endpoint...');
    const welcomeResponse = await fetch(`${API_CONFIG.BASE_URL}/api`);
    if (welcomeResponse.ok) {
      const welcomeData = await welcomeResponse.json();
      results.welcomeEndpoint = true;
      console.log('✅ Welcome endpoint passed:', welcomeData);
    } else {
      throw new Error(`Welcome endpoint failed: ${welcomeResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Welcome endpoint failed:', error);
    results.errors.push(`Welcome endpoint: ${error.message}`);
  }

  // Test API service configuration
  try {
    console.log('🔍 Testing API service configuration...');
    console.log('API Base URL:', apiService.defaults?.baseURL || 'Not set');
    console.log('API Timeout:', apiService.defaults?.timeout || 'Default');
    console.log('✅ API service configured');
  } catch (error) {
    console.error('❌ API service configuration error:', error);
    results.errors.push(`API service: ${error.message}`);
  }

  const overallSuccess = results.healthCheck && results.welcomeEndpoint;
  
  console.log('\n📊 Connection Test Results:');
  console.log('==========================');
  console.log(`Health Check: ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Welcome API: ${results.welcomeEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Overall: ${overallSuccess ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return {
    ...results,
    connected: overallSuccess
  };
};

/**
 * Test authentication endpoints (when ready)
 */
export const testAuthEndpoints = async () => {
  console.log('🔍 Testing authentication endpoints...');
  
  try {
    // Test register endpoint with dummy data
    const registerResponse = await fetch(`${API_CONFIG.BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123'
      })
    });

    if (registerResponse.ok) {
      console.log('✅ Register endpoint working');
      return true;
    } else {
      const errorData = await registerResponse.json();
      console.log('ℹ️ Register endpoint response:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Auth endpoints test failed:', error);
    return false;
  }
};

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  // Wait a bit for the app to initialize
  setTimeout(() => {
    testConnection();
  }, 2000);
} 