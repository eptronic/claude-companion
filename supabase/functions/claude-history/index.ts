
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const ANTHROPIC_API_KEY = Deno.env.get('CLAUDE_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not set');
    }

    console.log('Fetching Claude history...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY
      },
      // Add query parameters as needed
      // Example: ?limit=10&order=desc
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched history');
    
    // Return mock data for now since the API might not be fully set up
    return new Response(JSON.stringify([
      { id: '1', title: 'Previous Chat 1', timestamp: new Date().toISOString() },
      { id: '2', title: 'Previous Chat 2', timestamp: new Date().toISOString() }
    ]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in claude-history function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch conversation history',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
