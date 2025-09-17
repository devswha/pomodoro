/**
 * API Testing Script
 *
 * Basic script to test API endpoints during development.
 * Run with: npm run test:api
 */

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

// Test authentication endpoint
async function testAuth() {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Test registration (use a test user)
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'test1234',
        displayName: 'Test User'
      })
    });
    
    if (registerResponse.ok) {
      console.log('✅ Registration test passed');
    } else {
      console.log('❌ Registration test failed:', registerResponse.status);
    }
    
    // Test login
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'test1234'
      })
    });
    
    if (loginResponse.status === 401 || loginResponse.ok) {
      console.log('✅ Login endpoint is responding');
    } else {
      console.log('❌ Login test failed:', loginResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
  }
}

// Test protected endpoint
async function testProtectedEndpoint() {
  console.log('🔒 Testing Protected Endpoint...');
  
  try {
    const response = await fetch(`${baseUrl}/api/users/profile`);
    
    if (response.status === 401) {
      console.log('✅ Protected endpoint correctly requires authentication');
    } else {
      console.log('❌ Protected endpoint test failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Protected endpoint test error:', error.message);
  }
}

// Test dashboard endpoint  
async function testDashboard() {
  console.log('📊 Testing Dashboard...');
  
  try {
    const response = await fetch(`${baseUrl}/api/dashboard`);
    
    if (response.status === 401) {
      console.log('✅ Dashboard endpoint correctly requires authentication');
    } else if (response.ok) {
      console.log('✅ Dashboard endpoint is responding');
    } else {
      console.log('❌ Dashboard test failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Dashboard test error:', error.message);
  }
}

// Test leaderboard (public endpoint)
async function testLeaderboard() {
  console.log('🏆 Testing Leaderboard...');
  
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/leaderboard`);
    
    if (response.ok || response.status === 503) {
      console.log('✅ Leaderboard endpoint is responding');
    } else {
      console.log('❌ Leaderboard test failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Leaderboard test error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log(`Testing against: ${baseUrl}\n`);
  
  await testAuth();
  console.log('');
  
  await testProtectedEndpoint();
  console.log('');
  
  await testDashboard();
  console.log('');
  
  await testLeaderboard();
  console.log('');
  
  console.log('✨ API Tests Complete!\n');
  console.log('Note: Some tests may fail if Supabase is not configured.');
  console.log('Check the API_INTEGRATION_GUIDE.md for setup instructions.');
}

// Handle command line execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runTests().catch(console.error);
}

export { runTests };