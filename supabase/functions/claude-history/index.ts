
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    // Get the user token from the request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '')

    // Set the auth token for the client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Fetch chats for the authenticated user
    const { data: chats, error: chatsError } = await supabaseClient
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false })

    if (chatsError) {
      throw chatsError
    }

    // Fetch projects for the authenticated user
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (projectsError) {
      throw projectsError
    }

    console.log('Successfully fetched history and projects');
    
    return new Response(JSON.stringify({
      chats: chats || [],
      projects: projects || []
    }), {
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
