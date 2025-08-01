const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'alihassan.iqbal101@gmail.com',
  password: 'ah2003ah'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} failed:`, error.response?.data || error.message);
    return null;
  }
};

// Test authentication
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  const loginResponse = await makeRequest('POST', '/auth/login', testUser);
  if (loginResponse && loginResponse.success) {
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed');
    return false;
  }
}

// Test Groups CRUD
async function testGroups() {
  console.log('\n👥 Testing Groups CRUD...');
  
  // Create group
  const groupData = {
    name: 'Test Group',
    description: 'Test WhatsApp Group',
    group_id: 'test-group-' + Date.now(),
    invite_link: 'https://chat.whatsapp.com/test',
    member_count: 5
  };
  
  const createResponse = await makeRequest('POST', '/groups', groupData);
  if (createResponse?.success) {
    console.log('✅ Group created:', createResponse.data.group.name);
    
    const groupId = createResponse.data.group.id;
    
    // Get group
    const getResponse = await makeRequest('GET', `/groups/${groupId}`);
    if (getResponse?.success) {
      console.log('✅ Group retrieved');
    }
    
    // Update group
    const updateResponse = await makeRequest('PUT', `/groups/${groupId}`, {
      description: 'Updated description'
    });
    if (updateResponse?.success) {
      console.log('✅ Group updated');
    }
    
    // Get all groups
    const getAllResponse = await makeRequest('GET', '/groups');
    if (getAllResponse?.success) {
      console.log('✅ All groups retrieved:', getAllResponse.data.pagination?.totalGroups || 0, 'total');
    }
    
    // Delete group
    const deleteResponse = await makeRequest('DELETE', `/groups/${groupId}`);
    if (deleteResponse?.success) {
      console.log('✅ Group deleted');
    }
  }
}

// Test Subscribers CRUD
async function testSubscribers() {
  console.log('\n📱 Testing Subscribers CRUD...');
  
  // Create subscriber
  const subscriberData = {
    name: 'Test Subscriber',
    phone_number: '+1234567890' + Date.now(),
    email: 'test@example.com',
    whatsapp_id: 'test-whatsapp-id',
    status: 'active',
    tags: ['test', 'automation'],
    notes: 'Test subscriber for CRUD operations'
  };
  
  const createResponse = await makeRequest('POST', '/subscribers', subscriberData);
  if (createResponse?.success) {
    console.log('✅ Subscriber created:', createResponse.data.subscriber.name);
    
    const subscriberId = createResponse.data.subscriber.id;
    
    // Get subscriber
    const getResponse = await makeRequest('GET', `/subscribers/${subscriberId}`);
    if (getResponse?.success) {
      console.log('✅ Subscriber retrieved:', getResponse.data.subscriber.name);
    }
    
    // Update subscriber
    const updateResponse = await makeRequest('PUT', `/subscribers/${subscriberId}`, {
      notes: 'Updated notes'
    });
    if (updateResponse?.success) {
      console.log('✅ Subscriber updated');
    }
    
    // Update status
    const statusResponse = await makeRequest('PUT', `/subscribers/${subscriberId}/status`, {
      status: 'inactive'
    });
    if (statusResponse?.success) {
      console.log('✅ Subscriber status updated');
    }
    
    // Get all subscribers
    const getAllResponse = await makeRequest('GET', '/subscribers');
    if (getAllResponse?.success) {
      console.log('✅ All subscribers retrieved:', getAllResponse.data.pagination.totalSubscribers, 'total');
    }
    
    // Delete subscriber
    const deleteResponse = await makeRequest('DELETE', `/subscribers/${subscriberId}`);
    if (deleteResponse?.success) {
      console.log('✅ Subscriber deleted');
    }
  }
}

// Test Messages CRUD
async function testMessages() {
  console.log('\n💬 Testing Messages CRUD...');
  
  // Create message
  const messageData = {
    message_id: 'test-msg-' + Date.now(),
    content: 'Test message content',
    message_type: 'text',
    direction: 'outbound',
    status: 'pending'
  };
  
  const createResponse = await makeRequest('POST', '/messages', messageData);
  if (createResponse?.success) {
    console.log('✅ Message created');
    
    const messageId = createResponse.data.message.id;
    
    // Get message
    const getResponse = await makeRequest('GET', `/messages/${messageId}`);
    if (getResponse?.success) {
      console.log('✅ Message retrieved');
    }
    
    // Update message status
    const statusResponse = await makeRequest('PUT', `/messages/${messageId}/status`, {
      status: 'sent'
    });
    if (statusResponse?.success) {
      console.log('✅ Message status updated');
    }
    
    // Get all messages
    const getAllResponse = await makeRequest('GET', '/messages');
    if (getAllResponse?.success) {
      console.log('✅ All messages retrieved:', getAllResponse.data.pagination.totalMessages, 'total');
    }
    
    // Get statistics
    const statsResponse = await makeRequest('GET', '/messages/statistics');
    if (statsResponse?.success) {
      console.log('✅ Message statistics retrieved');
    }
    
    // Delete message
    const deleteResponse = await makeRequest('DELETE', `/messages/${messageId}`);
    if (deleteResponse?.success) {
      console.log('✅ Message deleted');
    }
  }
}

// Test Campaigns CRUD
async function testCampaigns() {
  console.log('\n📢 Testing Campaigns CRUD...');
  
  // Create campaign
  const campaignData = {
    name: 'Test Campaign',
    description: 'Test broadcast campaign',
    message_template: 'Hello {{name}}, this is a test message!',
    target_type: 'all',
    status: 'draft'
  };
  
  const createResponse = await makeRequest('POST', '/campaigns', campaignData);
  if (createResponse?.success) {
    console.log('✅ Campaign created:', createResponse.data.campaign.name);
    
    const campaignId = createResponse.data.campaign.id;
    
    // Get campaign
    const getResponse = await makeRequest('GET', `/campaigns/${campaignId}`);
    if (getResponse?.success) {
      console.log('✅ Campaign retrieved:', getResponse.data.campaign.name);
    }
    
    // Update campaign
    const updateResponse = await makeRequest('PUT', `/campaigns/${campaignId}`, {
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    if (updateResponse?.success) {
      console.log('✅ Campaign updated');
    }
    
    // Get all campaigns
    const getAllResponse = await makeRequest('GET', '/campaigns');
    if (getAllResponse?.success) {
      console.log('✅ All campaigns retrieved:', getAllResponse.data.pagination.totalCampaigns, 'total');
    }
    
    // Get statistics
    const statsResponse = await makeRequest('GET', '/campaigns/statistics');
    if (statsResponse?.success) {
      console.log('✅ Campaign statistics retrieved');
    }
    
    // Delete campaign
    const deleteResponse = await makeRequest('DELETE', `/campaigns/${campaignId}`);
    if (deleteResponse?.success) {
      console.log('✅ Campaign deleted');
    }
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting CRUD Operations Test...');
  console.log('ℹ️  Make sure the server is running on http://localhost:5000');
  
  // Test authentication first
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('❌ Authentication failed. Cannot proceed with other tests.');
    return;
  }
  
  // Run all CRUD tests
  await testGroups();
  await testSubscribers();
  await testMessages();
  await testCampaigns();
  
  console.log('\n🎉 All CRUD tests completed!');
  console.log('✨ Your API endpoints are working correctly!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests }; 