import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get('sk_test_7574295cffb7c1ab4beea751cf6b3407923020d4');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    const { email, amount, metadata, callback_url } = await req.json();

    // Validate input
    if (!email || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize payment with Paystack using SECRET KEY
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        metadata,
        callback_url
      }),
    });

    const data = await paystackResponse.json();

    if (!paystackResponse.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Payment initialization failed' }),
        { status: paystackResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the authorization URL to the frontend
    return new Response(
      JSON.stringify({ authorization_url: data.data.authorization_url }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});