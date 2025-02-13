import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testStripeConnection() {
  try {
    console.log('Testing Stripe connection...');
    
    // Read key directly from file
    const key = readFileSync(join(__dirname, 'stripe-key.txt'), 'utf8').trim();
    console.log('API Key format check:');
    console.log('- Starts with sk_test_:', key.startsWith('sk_test_'));
    console.log('- Length:', key.length);
    console.log('- Key:', key); // We'll see the full key for debugging
    
    const stripe = new Stripe(key, {
      apiVersion: '2025-01-27.acacia'
    });

    // Try to get balance - this is a simple API call that should work
    const balance = await stripe.balance.retrieve();
    console.log('Successfully connected to Stripe!');
    console.log('Available balance:', balance.available);
    console.log('Pending balance:', balance.pending);
  } catch (error) {
    console.error('Error connecting to Stripe:', error);
  }
}

testStripeConnection(); 