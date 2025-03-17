import fetch from 'node-fetch';

async function checkEndpoints() {
  try {
    console.log('Checking Featured Products endpoint...');
    const featuredResponse = await fetch('http://localhost:5177/api/products/featured');
    const featuredData = await featuredResponse.json();
    console.log('Featured Products Response:', JSON.stringify(featuredData, null, 2));
    
    console.log('\nChecking New Arrivals endpoint...');
    const newArrivalsResponse = await fetch('http://localhost:5177/api/products/new-arrivals');
    const newArrivalsData = await newArrivalsResponse.json();
    console.log('New Arrivals Response:', JSON.stringify(newArrivalsData, null, 2));
    
    console.log('\nChecking Active Collections endpoint...');
    const collectionsResponse = await fetch('http://localhost:5177/api/collections/active');
    const collectionsData = await collectionsResponse.json();
    console.log('Active Collections Response:', JSON.stringify(collectionsData, null, 2));
  } catch (error) {
    console.error('Error checking endpoints:', error);
  }
}

checkEndpoints();
