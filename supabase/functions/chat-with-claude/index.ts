
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Filter out messages with empty content
    const validMessages = messages.filter((msg: any) => {
      const content = typeof msg.content === 'string' ? msg.content : msg.content?.text;
      return content && content.trim() !== '';
    });

    if (validMessages.length === 0) {
      throw new Error('No valid messages to send to Claude');
    }

    console.log('Sending messages to Claude:', validMessages);

    // Add retry logic with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // Debug log for API key format (only logging first 4 chars for security)
        console.log('API Key format check:', CLAUDE_API_KEY.substring(0, 4));

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-01-01',
            'anthropic-beta': 'messages-2024-01-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            temperature: 0.7,
            messages: validMessages.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: typeof msg.content === 'string' ? msg.content : msg.content.text
            })),
            system: "You are a helpful AI assistant. Provide clear, concise responses."
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Claude API error response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });

          if (response.status === 401) {
            throw new Error('Invalid API key or authentication error with Claude API');
          }

          // If we get a 429 or 503, wait and retry
          if (response.status === 429 || response.status === 503) {
            attempts++;
            if (attempts < maxAttempts) {
              // Use the retry-after header if available, otherwise use exponential backoff
              const retryAfter = response.headers.get('retry-after');
              const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempts) * 1000;
              console.log(`Retrying after ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);
              await wait(delay);
              continue;
            }
          }
          
          throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Claude API response:', data);

        return new Response(JSON.stringify({ 
          content: data.content[0].text
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Request failed:', error);
        if (attempts === maxAttempts - 1) {
          throw error; // Rethrow on last attempt
        }
        attempts++;
        const delay = Math.pow(2, attempts) * 1000;
        console.log(`Request failed, retrying after ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);
        await wait(delay);
      }
    }

    throw new Error('Maximum retry attempts reached');

  } catch (error) {
    console.error('Error in chat-with-claude function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error && error.message.includes('API key') 
        ? 'Please check your Claude API key configuration.'
        : 'The service is temporarily unavailable. Please try again in a few moments.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
