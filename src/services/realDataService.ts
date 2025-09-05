import { supabase } from '@/integrations/supabase/client'

export interface TokenPrice {
  symbol: string
  price: number
  change24h: number
}

export interface LiquidityPool {
  pair: string
  token0: string
  token1: string
  tvl: number
  volume24h: number
  fee: number
  apy: number
  reserve0: number
  reserve1: number
  price: number
}

export class RealDataService {
  // Fetch real-time token prices
  static async getTokenPrices(): Promise<Record<string, TokenPrice>> {
    try {
      // First try to get cached data from database
      const { data: cachedPrices, error } = await supabase
        .from('token_prices')
        .select('*')

      if (error) throw error

      // Check if data is fresh (less than 5 minutes old)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const isFresh = cachedPrices?.some(price => 
        new Date(price.updated_at) > fiveMinutesAgo
      )

      if (isFresh && cachedPrices) {
        return cachedPrices.reduce((acc, price) => {
          acc[price.symbol] = {
            symbol: price.symbol,
            price: parseFloat(price.price),
            change24h: parseFloat(price.change_24h || '0')
          }
          return acc
        }, {} as Record<string, TokenPrice>)
      }

      // If data is stale, fetch fresh data from Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('get-gala-prices')
      
      if (functionError) throw functionError

      return data
    } catch (error) {
      console.error('Error fetching token prices:', error)
      // Fallback to demo data if real data fails
      return {
        GALA: { symbol: 'GALA', price: 0.025, change24h: 2.5 },
        USDC: { symbol: 'USDC', price: 1.0, change24h: 0.1 },
        USDT: { symbol: 'USDT', price: 1.0, change24h: -0.05 },
        WBTC: { symbol: 'WBTC', price: 100000, change24h: 1.8 },
        WETH: { symbol: 'WETH', price: 3333, change24h: 3.2 }
      }
    }
  }

  // Fetch liquidity pool data
  static async getLiquidityPools(): Promise<LiquidityPool[]> {
    try {
      // Try cached data first
      const { data: cachedPools, error } = await supabase
        .from('liquidity_pools')
        .select('*')

      if (error) throw error

      // Check if data is fresh (less than 10 minutes old)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const isFresh = cachedPools?.some(pool => 
        new Date(pool.updated_at) > tenMinutesAgo
      )

      if (isFresh && cachedPools) {
        return cachedPools.map(pool => ({
          pair: pool.pair,
          token0: pool.token0,
          token1: pool.token1,
          tvl: parseFloat(pool.tvl),
          volume24h: parseFloat(pool.volume_24h || '0'),
          fee: parseFloat(pool.fee),
          apy: parseFloat(pool.apy || '0'),
          reserve0: parseFloat(pool.reserve0),
          reserve1: parseFloat(pool.reserve1),
          price: parseFloat(pool.price)
        }))
      }

      // Fetch fresh data
      const { data, error: functionError } = await supabase.functions.invoke('get-gala-pools')
      
      if (functionError) throw functionError

      return data
    } catch (error) {
      console.error('Error fetching pool data:', error)
      // Fallback to demo data
      return []
    }
  }

  // Record a trade
  static async recordTrade(tradeData: {
    userWallet?: string
    fromToken: string
    toToken: string
    fromAmount: number
    toAmount: number
    priceImpact: number
    fee: number
    txHash?: string
  }) {
    try {
      const { error } = await supabase
        .from('user_trades')
        .insert({
          user_wallet: tradeData.userWallet,
          from_token: tradeData.fromToken,
          to_token: tradeData.toToken,
          from_amount: tradeData.fromAmount,
          to_amount: tradeData.toAmount,
          price_impact: tradeData.priceImpact,
          fee: tradeData.fee,
          tx_hash: tradeData.txHash,
          status: 'completed'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error recording trade:', error)
    }
  }
}