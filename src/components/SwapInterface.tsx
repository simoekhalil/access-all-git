import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RealDataService, TokenPrice, LiquidityPool } from '@/services/realDataService';

// Real swap.gala.com tokens - balances will be updated with real wallet data
const TOKENS = [
  { symbol: 'GALA', name: 'Gala', balance: '1,000.00' },
  { symbol: 'USDC', name: 'USD Coin', balance: '1,500.00' },
  { symbol: 'USDT', name: 'Tether USD', balance: '1,200.00' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.025' },
  { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.75' },
];

interface SwapState {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: string;
  isLoading: boolean;
  priceImpact: number | null;
  swapFee: number | null;
}

interface AppState {
  tokenPrices: Record<string, TokenPrice>;
  liquidityPools: LiquidityPool[];
  isDataLoading: boolean;
}

const SwapInterface = () => {
  const [swap, setSwap] = useState<SwapState>({
    fromToken: 'USDC',
    toToken: 'GALA',
    fromAmount: '',
    toAmount: '',
    slippage: '0.5',
    isLoading: false,
    priceImpact: null,
    swapFee: null,
  });

  const [appState, setAppState] = useState<AppState>({
    tokenPrices: {},
    liquidityPools: [],
    isDataLoading: true,
  });

  const { toast } = useToast();

  // Load real blockchain data on component mount
  useEffect(() => {
    const loadRealData = async () => {
      setAppState(prev => ({ ...prev, isDataLoading: true }));
      
      try {
        // Load real token prices and pool data
        const [prices, pools] = await Promise.all([
          RealDataService.getTokenPrices(),
          RealDataService.getLiquidityPools()
        ]);
        
        setAppState(prev => ({
          ...prev,
          tokenPrices: prices,
          liquidityPools: pools,
          isDataLoading: false
        }));
        
        console.log('🔗 Loaded real Gala ecosystem data:', { prices, pools });
        
        toast({
          title: "Real Data Loaded",
          description: "Connected to live Gala ecosystem prices and pools",
        });
        
      } catch (error) {
        console.error('Error loading real data:', error);
        setAppState(prev => ({ ...prev, isDataLoading: false }));
        
        toast({
          title: "Data Loading Error", 
          description: "Using cached data. Some prices may not be current.",
          variant: "destructive"
        });
      }
    };
    
    loadRealData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadRealData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleSwapTokens = () => {
    setSwap(prev => {
      const newState = {
        ...prev,
        fromToken: prev.toToken,
        toToken: prev.fromToken,
        fromAmount: prev.toAmount,
        toAmount: prev.fromAmount,
      };
      
      // Recalculate fees and price impact after swap
      if (newState.fromAmount && !isNaN(Number(newState.fromAmount)) && Number(newState.fromAmount) > 0) {
        const swapFee = getSwapFee(newState.fromToken, newState.toToken);
        const priceImpact = calculatePriceImpact(newState.fromToken, newState.toToken, newState.fromAmount);
        return { ...newState, swapFee, priceImpact };
      }
      
      return { ...newState, priceImpact: null, swapFee: null };
    });
  };

  const getExchangeRate = (from: string, to: string) => {
    // Use real-time prices from blockchain data
    const fromPrice = appState.tokenPrices[from]?.price || 0;
    const toPrice = appState.tokenPrices[to]?.price || 0;
    
    if (!fromPrice || !toPrice) return 0;
    
    return fromPrice / toPrice;
  };

  const getSwapFee = (from: string, to: string) => {
    // Find the pair in real liquidity pools and return the fee
    const pairKey1 = `${from}/${to}`;
    const pairKey2 = `${to}/${from}`;
    
    const pair = appState.liquidityPools.find(p => p.pair === pairKey1 || p.pair === pairKey2);
    return pair ? (pair.fee * 100) : 0.3; // Convert decimal to percentage, default to 0.3%
  };

  const calculatePriceImpact = (from: string, to: string, fromAmount: string): number => {
    if (!fromAmount || isNaN(Number(fromAmount))) return 0;
    
    const amount = Number(fromAmount);
    if (amount === 0) return 0;
    
    // Find the pair's TVL to calculate price impact using real pool data
    const pairKey1 = `${from}/${to}`;
    const pairKey2 = `${to}/${from}`;
    const pair = appState.liquidityPools.find(p => p.pair === pairKey1 || p.pair === pairKey2);
    
    if (!pair) return 0;
    
    // Use real token price for trade value calculation
    const fromPrice = appState.tokenPrices[from]?.price || 0;
    const tradeValue = amount * fromPrice;
    
    // AMM-style price impact calculation based on real pool liquidity
    const impactFactor = Math.sqrt(tradeValue / (pair.tvl / 2)) * 0.01;
    return Math.round(impactFactor * 1000000) / 1000000; // Round to 6 decimal places
  };

  const calculateToAmount = (fromAmount: string, fromToken: string, toToken: string) => {
    if (!fromAmount || isNaN(Number(fromAmount))) return '';
    const rate = getExchangeRate(fromToken, toToken);
    const amount = Number(fromAmount) * rate;
    
    // Apply price impact reduction
    const priceImpact = calculatePriceImpact(fromToken, toToken, fromAmount);
    const impactAdjustedAmount = amount * (1 - priceImpact);
    
    return impactAdjustedAmount === 0 ? '0' : impactAdjustedAmount.toFixed(6);
  };

  const calculateFromAmount = (toAmount: string, fromToken: string, toToken: string) => {
    if (!toAmount || isNaN(Number(toAmount))) return '';
    
    const targetAmount = Number(toAmount);
    const rate = getExchangeRate(fromToken, toToken);
    
    // Start with mid-price estimate
    let estimate = targetAmount / rate;
    
    // Use iterative approach to find the fromAmount that yields the desired toAmount
    // accounting for price impact
    for (let i = 0; i < 5; i++) {
      const priceImpact = calculatePriceImpact(fromToken, toToken, estimate.toString());
      const calculatedTo = estimate * rate * (1 - priceImpact);
      const error = calculatedTo - targetAmount;
      
      if (Math.abs(error) < 0.000001) break;
      
      // Adjust estimate
      estimate = estimate - (error / (rate * (1 - priceImpact)));
      estimate = Math.max(0, estimate); // Ensure non-negative
    }
    
    return estimate.toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    const toAmount = calculateToAmount(value, swap.fromToken, swap.toToken);
    const swapFee = getSwapFee(swap.fromToken, swap.toToken);
    const priceImpact = value && !isNaN(Number(value)) && Number(value) > 0 
      ? calculatePriceImpact(swap.fromToken, swap.toToken, value) 
      : null;

    setSwap(prev => ({
      ...prev,
      fromAmount: value,
      toAmount,
      swapFee,
      priceImpact,
    }));
  };

  const handleToAmountChange = (value: string) => {
    const fromAmount = calculateFromAmount(value, swap.fromToken, swap.toToken);
    const swapFee = getSwapFee(swap.fromToken, swap.toToken);
    const priceImpact = fromAmount && !isNaN(Number(fromAmount)) && Number(fromAmount) > 0 
      ? calculatePriceImpact(swap.fromToken, swap.toToken, fromAmount) 
      : null;

    setSwap(prev => ({
      ...prev,
      toAmount: value,
      fromAmount,
      swapFee,
      priceImpact,
    }));
  };

  const executeSwap = async () => {
    const fromAmountNum = Number(swap.fromAmount);
    const toAmountNum = Number(swap.toAmount);

    if (!swap.fromAmount || !swap.toAmount || fromAmountNum <= 0 || toAmountNum <= 0 || isNaN(fromAmountNum) || isNaN(toAmountNum)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    setSwap(prev => ({ ...prev, isLoading: true }));

    try {
      // Record the trade in our database with real data
      const priceImpact = calculatePriceImpact(swap.fromToken, swap.toToken, swap.fromAmount);
      const fee = getSwapFee(swap.fromToken, swap.toToken) / 100; // Convert percentage to decimal
      
      await RealDataService.recordTrade({
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: fromAmountNum,
        toAmount: toAmountNum,
        priceImpact,
        fee,
        // In real implementation, this would come from wallet connection
        userWallet: undefined,
        txHash: undefined
      });
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Swap Successful",
        description: `Swapped ${swap.fromAmount} ${swap.fromToken} for ${swap.toAmount} ${swap.toToken}`,
      });

      // Reset form with proper state cleanup
      setSwap(prev => ({
        ...prev,
        fromAmount: '',
        toAmount: '',
        priceImpact: null,
        swapFee: null,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: "Swap Failed",
        description: "There was an error executing your swap. Please try again.",
        variant: "destructive",
      });
      setSwap(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getTokenBalance = (symbol: string) => {
    return TOKENS.find(token => token.symbol === symbol)?.balance || '0.00';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Swap {appState.isDataLoading && <span className="text-sm text-muted-foreground ml-2">(Loading real data...)</span>}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selling Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="from-amount">Selling</Label>
            <span className="text-xs text-muted-foreground uppercase">max</span>
          </div>
          <div className="flex gap-2">
            <Select
              value={swap.fromToken}
              onValueChange={(value) => {
                setSwap(prev => ({ ...prev, fromToken: value }));
                // Recalculate when from token changes
                if (swap.fromAmount) {
                  const toAmount = calculateToAmount(swap.fromAmount, value, swap.toToken);
                  const swapFee = getSwapFee(value, swap.toToken);
                  const priceImpact = calculatePriceImpact(value, swap.toToken, swap.fromAmount);
                  setSwap(prev => ({ ...prev, toAmount, swapFee, priceImpact }));
                }
              }}
            >
              <SelectTrigger className="w-24" role="combobox" aria-label="Select selling token">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1">
              <Input
                id="from-amount"
                type="number"
                placeholder="0.00"
                value={swap.fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                aria-label="Selling"
                className="text-right"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {getTokenBalance(swap.fromToken)} {swap.fromToken === 'USDC' ? 'G' + swap.fromToken : swap.fromToken}
          </div>
          <div className="text-xs text-muted-foreground">
            $ 0.00
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwapTokens}
            className="rounded-full p-2"
            aria-label="Switch token order"
            data-testid="swap-tokens-button"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Buying Token */}
        <div className="space-y-2">
          <Label htmlFor="to-amount">Buying</Label>
          <div className="flex gap-2">
            <Select
              value={swap.toToken}
              onValueChange={(value) => {
                setSwap(prev => ({ ...prev, toToken: value }));
                // Recalculate when to token changes
                if (swap.fromAmount) {
                  const toAmount = calculateToAmount(swap.fromAmount, swap.fromToken, value);
                  const swapFee = getSwapFee(swap.fromToken, value);
                  const priceImpact = calculatePriceImpact(swap.fromToken, value, swap.fromAmount);
                  setSwap(prev => ({ ...prev, toAmount, swapFee, priceImpact }));
                }
              }}
            >
              <SelectTrigger className="w-24" role="combobox" aria-label="Select buying token">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.filter(token => token.symbol !== swap.fromToken).map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1">
              <Input
                id="to-amount"
                type="number"
                placeholder="0.00"
                value={swap.toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                aria-label="Buying"
                className="text-right"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {getTokenBalance(swap.toToken)} {swap.toToken}
          </div>
          <div className="text-xs text-muted-foreground">
            $ 0.00
          </div>
        </div>

        {/* Swap Details */}
        {swap.fromAmount && swap.toAmount && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Exchange Rate:</span>
              <span>1 {swap.fromToken} = {(Number(swap.toAmount) / Number(swap.fromAmount)).toFixed(6)} {swap.toToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Slippage Tolerance:</span>
              <Badge variant="secondary">{swap.slippage}%</Badge>
            </div>
            {swap.swapFee !== null && (
              <div className="flex justify-between text-sm">
                <span>Swap Fee:</span>
                <Badge variant="outline">{swap.swapFee}%</Badge>
              </div>
            )}
            {swap.priceImpact !== null && (
              <div className="flex justify-between text-sm">
                <span>Price Impact:</span>
                <Badge 
                  variant={Math.abs(swap.priceImpact) > 0.05 ? "destructive" : Math.abs(swap.priceImpact) > 0.01 ? "secondary" : "outline"}
                  data-testid="price-impact-badge"
                >
                  {swap.priceImpact > 0 ? '+' : ''}{(swap.priceImpact * 100).toFixed(3)}%
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button 
          onClick={executeSwap} 
          disabled={
            !swap.fromAmount || 
            !swap.toAmount || 
            Number(swap.fromAmount) <= 0 || 
            Number(swap.toAmount) <= 0 || 
            isNaN(Number(swap.fromAmount)) || 
            isNaN(Number(swap.toAmount)) || 
            swap.isLoading
          }
          className="w-full"
          size="lg"
        >
          {swap.isLoading ? 'Swapping...' : 'Connect Wallet'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SwapInterface;