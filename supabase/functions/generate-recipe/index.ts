import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OpenAI_API');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { ingredients, dietFilters, language, servings } = await req.json();
    
    // Input validation
    if (!ingredients || typeof ingredients !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid ingredients format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedIngredients = ingredients.trim();
    if (trimmedIngredients.length < 3) {
      return new Response(JSON.stringify({ error: 'Ingredients must be at least 3 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (trimmedIngredients.length > 500) {
      return new Response(JSON.stringify({ error: 'Ingredients must be less than 500 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Generating recipe for user');

    // Build diet filter instruction
    let dietInstruction = '';
    if (dietFilters && typeof dietFilters === 'string' && dietFilters.length > 0) {
      dietInstruction = `\n\nPERATURAN TAMBAHAN (WAJIB DIPATUHI): Resep ini harus memenuhi kriteria berikut: ${dietFilters}.`;
    }

    // Build language instruction
    let languageInstruction = '';
    if (language && typeof language === 'string' && language.length > 0) {
      languageInstruction = `\n\nPENTING: Tulis seluruh respons resep (judul, bahan, langkah-langkah) dalam Bahasa: ${language}.`;
    }

    // Build servings instruction
    const servingsCount = servings && typeof servings === 'number' && servings >= 1 ? servings : 2;
    const servingsInstruction = `\n\nPENTING: Sesuaikan takaran/jumlah bahan dalam resep ini secara spesifik untuk ${servingsCount} porsi/orang. Pastikan jumlah bahannya masuk akal dan sesuaikan resepnya (contoh: jangan tulis '0.1 butir telur', tapi ubah resepnya agar tetap praktis).`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Kamu adalah "Ide.Chef", seorang asisten koki virtual yang cerdas dan kreatif. Tujuan utamamu adalah membantu pengguna mengurangi limbah makanan dengan membuat resep dari bahan yang mereka miliki.' 
          },
          { 
            role: 'user', 
            content: `Berdasarkan bahan berikut: ${trimmedIngredients}, buatkan satu resep masakan sederhana dan lezat. Sertakan judul resep yang menarik, daftar 'Bahan Tambahan' jika ada yang diperlukan, dan 'Langkah-langkah Pembuatan' yang jelas.${dietInstruction}${languageInstruction}${servingsInstruction}\n\nFormat resep:\n\nJudul Resep: [Nama Resep]\nPorsi: ${servingsCount} Orang\n\nBahan Utama (Disesuaikan untuk ${servingsCount} porsi):\n[daftar bahan dengan takaran yang sudah dihitung]\n\nLangkah-langkah Pembuatan:\n[langkah-langkah memasak]\n\nPENTING: Di bagian paling akhir, tambahkan juga:\n\nEstimasi Waktu Memasak: [waktu dalam menit]\nEstimasi Jumlah Kalori: [jumlah kalori per porsi]` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API request failed:', response.status, errorText);
      throw new Error('Failed to generate recipe');
    }

    const data = await response.json();
    const recipe = data.choices[0].message.content;

    console.log('Recipe generated successfully');

    return new Response(JSON.stringify({ recipe }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recipe generation failed');
    return new Response(JSON.stringify({ error: 'Unable to generate recipe. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
