-- Run this SQL in your Supabase SQL Editor to set up the tables

-- Create token_prices table
CREATE TABLE IF NOT EXISTS token_prices (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  change_24h DECIMAL(10, 4),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create liquidity_pools table
CREATE TABLE IF NOT EXISTS liquidity_pools (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) UNIQUE NOT NULL,
  token0 VARCHAR(10) NOT NULL,
  token1 VARCHAR(10) NOT NULL,
  tvl DECIMAL(20, 2) NOT NULL,
  volume_24h DECIMAL(20, 2),
  fee DECIMAL(6, 6) NOT NULL,
  apy DECIMAL(8, 4),
  reserve0 DECIMAL(20, 8) NOT NULL,
  reserve1 DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_trades table for tracking swap history
CREATE TABLE IF NOT EXISTS user_trades (
  id SERIAL PRIMARY KEY,
  user_wallet VARCHAR(42),
  from_token VARCHAR(10) NOT NULL,
  to_token VARCHAR(10) NOT NULL,
  from_amount DECIMAL(20, 8) NOT NULL,
  to_amount DECIMAL(20, 8) NOT NULL,
  price_impact DECIMAL(8, 6) NOT NULL,
  fee DECIMAL(8, 6) NOT NULL,
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE token_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to prices and pools
CREATE POLICY "Allow public read access to token prices" ON token_prices
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to liquidity pools" ON liquidity_pools
  FOR SELECT USING (true);

-- Create policies for user trades (users can only see their own)
CREATE POLICY "Users can view their own trades" ON user_trades
  FOR SELECT USING (auth.uid()::text = user_wallet OR user_wallet IS NULL);

CREATE POLICY "Users can insert their own trades" ON user_trades
  FOR INSERT WITH CHECK (auth.uid()::text = user_wallet OR user_wallet IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_token_prices_symbol ON token_prices (symbol);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_pair ON liquidity_pools (pair);
CREATE INDEX IF NOT EXISTS idx_user_trades_wallet ON user_trades (user_wallet);
CREATE INDEX IF NOT EXISTS idx_user_trades_created_at ON user_trades (created_at);

-- Insert initial token data
INSERT INTO token_prices (symbol, price, change_24h) VALUES
  ('GALA', 0.025, 0),
  ('USDC', 1.0, 0),
  ('USDT', 1.0, 0),
  ('WBTC', 100000, 0),
  ('WETH', 3333, 0)
ON CONFLICT (symbol) DO NOTHING;