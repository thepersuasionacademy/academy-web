// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const INTERCOM_CLIENT_SECRET = Deno.env.get('INTERCOM_CLIENT_SECRET')
const SENJA_API_KEY = Deno.env.get('SENJA_API_KEY')

console.log("Hello from Functions!")

serve(async (req) => {
  try {
    // Get the raw body
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    // Get Intercom webhook headers
    const signature = req.headers.get('x-hub-signature')
    const timestamp = req.headers.get('x-hub-signature-timestamp')

    // For test events, bypass verification
    if (body.topic === 'test') {
      return new Response(
        JSON.stringify({ message: 'Test webhook received successfully' }),
        { status: 200 }
      )
    }

    // Check if this is a CSAT response
    if (body.topic !== 'conversation_rating' || !body.data) {
      return new Response(
        JSON.stringify({ message: 'Not a CSAT response, ignoring' }),
        { status: 200 }
      )
    }

    // Transform the data for Senja
    const senjaData = {
      customer: {
        email: body.data.conversation.customer.email,
        name: body.data.conversation.customer.name
      },
      rating: body.data.conversation_rating.rating,
      comment: body.data.conversation_rating.remark || '',
      source: 'Intercom CSAT',
      timestamp: new Date(body.data.conversation_rating.created_at).toISOString()
    }

    // Send to Senja
    const senjaResponse = await fetch('https://api.senja.io/v1/testimonials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENJA_API_KEY}`
      },
      body: JSON.stringify(senjaData)
    })

    if (!senjaResponse.ok) {
      throw new Error(`Failed to send to Senja: ${senjaResponse.statusText}`)
    }

    return new Response(
      JSON.stringify({ message: 'Successfully forwarded CSAT to Senja' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/intercom-webhook' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
