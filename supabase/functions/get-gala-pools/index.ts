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

    // Get current token prices
    const { data: tokenPrices } = await supabaseClient
      .from('token_prices')
      .select('*')

    const priceMap = tokenPrices?.reduce((acc, token) => {
      acc[token.symbol] = token.price
      return acc
    }, {} as Record<string, number>) || {}

    // Mock pool data with realistic TVL calculations based on real prices
    // In production, this would fetch from Gala's DEX contracts
    const pools = [
      {
        pair: 'GALA/USDC',
        token0: 'GALA',
        token1: 'USDC',
        tvl: 2500000, // $2.5M TVL
        volume24h: 180000,
        fee: 0.003,
        apy: 8.5,
        reserve0: 50000000, // 50M GALA tokens
        reserve1: 1250000, // 1.25M USDC
        price: priceMap.GALA / priceMap.USDC
      },
      {
        pair: 'GALA/WETH',
        token0: 'GALA',
        token1: 'WETH',
        tvl: 1800000,
        volume24h: 120000,
        fee: 0.003,
        apy: 12.3,
        reserve0: 36000000,
        reserve1: 540, // 540 WETH
        price: priceMap.GALA / priceMap.WETH
      },
      {
        pair: 'USDC/WETH',
        token0: 'USDC',
        token1: 'WETH',
        tvl: 3200000,
        volume24h: 450000,
        fee: 0.003,
        apy: 6.8,
        reserve0: 1600000,
        reserve1: 480,
        price: priceMap.USDC / priceMap.WETH
      },
      {
        pair: 'GALA/WBTC',
        token0: 'GALA',
        token1: 'WBTC',
        tvl: 900000,
        volume24h: 65000,
        fee: 0.003,
        apy: 15.2,
        reserve0: 18000000,
        reserve1: 9, // 9 WBTC
        price: priceMap.GALA / priceMap.WBTC
      },
      {
        pair: 'USDC/USDT',
        token0: 'USDC',
        token1: 'USDT',
        tvl: 5000000,
        volume24h: 800000,
        fee: 0.001, // Lower fee for stablecoin pair
        apy: 2.1,
        reserve0: 2500000,
        reserve1: 2500000,
        price: priceMap.USDC / priceMap.USDT
      }
    ]

    // Cache pool data
    const { error } = await supabaseClient
      .from('liquidity_pools')
      .upsert(
        pools.map(pool => ({
          pair: pool.pair,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.tvl,
          volume_24h: pool.volume24h,
          fee: pool.fee,
          apy: pool.apy,
          reserve0: pool.reserve0,
          reserve1: pool.reserve1,
          price: pool.price,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'pair' }
      )

    if (error) {
      console.error('Database error:', error)
    }

    return new Response(
      JSON.stringify(pools),
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