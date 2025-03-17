import fetch from 'node-fetch';

// Test endpoint function
async function testEndpoint(url, method = 'GET', token = null, body = null) {
  console.log(`\nTesting ${method} ${url}`);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log('Status Code:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error('Error:', error.message);
    return { error: error.message };
  }
}

// Main function to run tests
async function runTests() {
  console.log('---- API ENDPOINT TESTS ----');
  
  // Test business customers endpoint (would need admin token)
  await testEndpoint('http://localhost:5177/api/business-customers?page=1&limit=10');
  
  // Try with customer endpoints
  await testEndpoint('http://localhost:5177/api/customers');
  
  console.log('\nTests completed');
}

// Run the tests
runTests();
