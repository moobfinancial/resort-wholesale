#!/usr/bin/env node

const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5177';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};
const TEST_PRODUCT_ID = 'prod_01'; // Using a valid product ID format

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making request to: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...options.headers
    })
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test functions
async function testGuestCart() {
  console.log('\n=== Testing Guest Cart ===');
  
  // Add item to guest cart
  console.log('\nAdding item to guest cart...');
  const guestCartId = `guest-cart-${Date.now()}`;
  const addItemResponse = await apiRequest(`/api/guest-cart/${guestCartId}`, {
    method: 'POST',
    body: JSON.stringify({
      productId: TEST_PRODUCT_ID,
      quantity: 2
    })
  });
  
  console.log(`Status: ${addItemResponse.status}`);
  console.log('Response:', JSON.stringify(addItemResponse.data, null, 2));
  
  // Get guest cart
  console.log('\nGetting guest cart...');
  const getCartResponse = await apiRequest(`/api/guest-cart/${guestCartId}`);
  
  console.log(`Status: ${getCartResponse.status}`);
  console.log('Response:', JSON.stringify(getCartResponse.data, null, 2));
  
  return guestCartId;
}

async function testUserAuth() {
  console.log('\n=== Testing User Authentication ===');
  
  // Login
  console.log('\nLogging in...');
  const loginResponse = await apiRequest('/api/customer/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
  
  console.log(`Status: ${loginResponse.status}`);
  console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
  
  if (loginResponse.status !== 200) {
    console.error('Login failed. Please check credentials.');
    return null;
  }
  
  // Extract token
  const token = loginResponse.data.token || 
                (loginResponse.data.data && loginResponse.data.data.token);
  
  if (!token) {
    console.error('No token found in response');
    return null;
  }
  
  console.log(`Token: ${token.substring(0, 20)}...`);
  return token;
}

async function testUserCart(token) {
  console.log('\n=== Testing User Cart ===');
  
  if (!token) {
    console.error('No authentication token provided');
    return;
  }
  
  // Get user cart
  console.log('\nGetting user cart...');
  const getCartResponse = await apiRequest('/api/cart', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Status: ${getCartResponse.status}`);
  console.log('Response:', JSON.stringify(getCartResponse.data, null, 2));
  
  // Add item to user cart
  console.log('\nAdding item to user cart...');
  const addItemResponse = await apiRequest('/api/cart/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId: TEST_PRODUCT_ID,
      quantity: 1
    })
  });
  
  console.log(`Status: ${addItemResponse.status}`);
  console.log('Response:', JSON.stringify(addItemResponse.data, null, 2));
  
  // Get updated user cart
  console.log('\nGetting updated user cart...');
  const updatedCartResponse = await apiRequest('/api/cart', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Status: ${updatedCartResponse.status}`);
  console.log('Response:', JSON.stringify(updatedCartResponse.data, null, 2));
}

// Main test function
async function runTests() {
  try {
    console.log('=== Starting Cart API Tests ===');
    
    // Test guest cart
    const guestCartId = await testGuestCart();
    
    // Test user authentication
    const token = await testUserAuth();
    
    // Test user cart
    if (token) {
      await testUserCart(token);
    }
    
    console.log('\n=== Tests Completed ===');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests();
