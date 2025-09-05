import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Fetch real token prices from CoinGecko API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=gala,usd-coin,tether,wrapped-bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices')
    }

    const priceData = await response.json()
    
    // Transform to our token format
    const tokenPrices = {
      GALA: {
        price: priceData.gala?.usd || 0.025,
        change24h: priceData.gala?.usd_24h_change || 0,
        symbol: 'GALA'
      },
      USDC: {
        price: priceData['usd-coin']?.usd || 1.0,
        change24h: priceData['usd-coin']?.usd_24h_change || 0,
        symbol: 'USDC'
      },
      USDT: {
        price: priceData.tether?.usd || 1.0,
        change24h: priceData.tether?.usd_24h_change || 0,
        symbol: 'USDT'
      },
      WBTC: {
        price: priceData['wrapped-bitcoin']?.usd || 100000,
        change24h: priceData['wrapped-bitcoin']?.usd_24h_change || 0,
        symbol: 'WBTC'
      },
      WETH: {
        price: priceData.ethereum?.usd || 3333,
        change24h: priceData.ethereum?.usd_24h_change || 0,
        symbol: 'WETH'
      }
    }

    // Cache prices in database
    const { error } = await supabaseClient
      .from('token_prices')
      .upsert(
        Object.entries(tokenPrices).map(([symbol, data]) => ({
          symbol,
          price: data.price,
          change_24h: data.change24h,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'symbol' }
      )

    if (error) {
      console.error('Database error:', error)
    }

    return new Response(
      JSON.stringify(tokenPrices),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})