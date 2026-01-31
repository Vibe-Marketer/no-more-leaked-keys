// Test reading API key from .env file
require('dotenv').config();

const apiKey = process.env.TEST_API_KEY;

if (apiKey) {
    console.log('[SUCCESS] TEST_API_KEY loaded from .env');
    console.log(`Key starts with: ${apiKey.substring(0, 4)}...`);
    console.log(`Key length: ${apiKey.length} characters`);
} else {
    console.log('[ERROR] TEST_API_KEY not found in .env');
}
