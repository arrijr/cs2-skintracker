#!/usr/bin/env node
// API Contract Test Script
// Führt automatische Tests der API Response Formate durch

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'https://cs2-skintracker.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app';

async function testApiContract() {
  console.log('🔍 Testing API Contract...');
  
  try {
    // Test Backend API
    const apiResponse = await makeRequest(`${API_BASE_URL}/api/v1/skins?page=1&pageSize=5`);
    
    // Prüfe Response Format
    const requiredFields = ['items', 'total', 'page', 'pageSize', 'totalPages', 'hasNextPage', 'hasPrevPage'];
    const missingFields = requiredFields.filter(field => !(field in apiResponse));
    
    if (missingFields.length > 0) {
      console.error('❌ API Contract Violation!');
      console.error('Missing fields:', missingFields);
      console.error('Response:', JSON.stringify(apiResponse, null, 2));
      process.exit(1);
    }
    
    // Prüfe, dass alte Felder NICHT vorhanden sind
    if ('skins' in apiResponse || 'pagination' in apiResponse) {
      console.error('❌ Old API format detected!');
      console.error('Response contains old fields:', Object.keys(apiResponse));
      process.exit(1);
    }
    
    console.log('✅ Backend API Contract OK');
    
    // Test Frontend (optional)
    try {
      const frontendResponse = await makeRequest(`${FRONTEND_URL}/skins`);
      console.log('✅ Frontend accessible');
    } catch (error) {
      console.log('⚠️  Frontend not accessible (might be protected)');
    }
    
    console.log('🎉 All API Contract Tests passed!');
    
  } catch (error) {
    console.error('❌ API Contract Test failed:', error.message);
    process.exit(1);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Führe Tests aus
testApiContract();
