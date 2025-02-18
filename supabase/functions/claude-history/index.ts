
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

    // For now, return mock data since the messages endpoint requires specific parameters
    // that we'll implement in a future update
    const mockHistory = [
      { 
        id: '1', 
        title: 'Previous Chat 1', 
        timestamp: new Date().toISOString(),
        preview: 'This is a preview of the first conversation...'
      },
      { 
        id: '2', 
        title: 'Previous Chat 2', 
        timestamp: new Date().toISOString(),
        preview: 'This is a preview of the second conversation...'
      }
    ];

    console.log('Returning mock history data');
    
    return new Response(JSON.stringify(mockHistory), {
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
