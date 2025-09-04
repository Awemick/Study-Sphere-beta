import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const HUGGING_FACE_API_KEY = Deno.env.get('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');
serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }
  try {
    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Text is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Call Hugging Face API
    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `Generate 5 multiple-choice flashcards from the following text. Format as JSON: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"}]. Text: ${text.substring(0, 1000)}`
      })
    });
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
