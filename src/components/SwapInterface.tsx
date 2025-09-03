import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Current GalaSwap tokens as per live data from https://swap.gala.com/explore (December 2024)
const TOKENS = [
  { symbol: 'GALA', name: 'Gala', balance: '1,000.00' },
  { symbol: 'USDC', name: 'USD Coin', balance: '1,500.00' },
  { symbol: 'USDT', name: 'Tether USD', balance: '1,200.00' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.025' },
  { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.75' },
  { symbol: 'WEN', name: 'Wen Token', balance: '50,000.00' },
  { symbol: '$GMUSIC', name: 'Gala Music', balance: '500.00' },
  { symbol: 'FILM', name: 'Gala Film', balance: '250.00' },
  { symbol: 'WXRP', name: 'Wrapped XRP', balance: '2,000.00' },
];

interface SwapState {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: string;
  isLoading: boolean;
  priceImpact: number | null;
  midPrice: number | null;
  executionPrice: number | null;
}

const SwapInterface = () => {
  const [swap, setSwap] = useState<SwapState>({
    fromToken: 'GALA',
    toToken: 'USDC',
    fromAmount: '',
    toAmount: '',
    slippage: '0.5',
    isLoading: false,
    priceImpact: null,
    midPrice: null,
    executionPrice: null,
  });
  const { toast } = useToast();

  const handleSwapTokens = () => {
    setSwap(prev => {
      const newState = {
        ...prev,
        fromToken: prev.toToken,
        toToken: prev.fromToken,
        fromAmount: prev.toAmount,
        toAmount: prev.fromAmount,
      };
      
      // Recalculate price impact after swap
      if (newState.fromAmount && !isNaN(Number(newState.fromAmount)) && Number(newState.fromAmount) > 0) {
        const midPrice = getExchangeRate(newState.fromToken, newState.toToken);
        const executionPrice = getExecutionPrice(newState.fromToken, newState.toToken, newState.fromAmount);
        const priceImpact = calculatePriceImpact(midPrice, executionPrice);
        return { ...newState, midPrice, executionPrice, priceImpact };
      }
      
      return { ...newState, priceImpact: null, midPrice: null, executionPrice: null };
    });
  };

  const getExchangeRate = (from: string, to: string) => {
    // Current GalaSwap exchange rates based on live data (mid-prices)
    const rates: Record<string, Record<string, number>> = {
      GALA: { 
        USDC: 0.025,        // 1 GALA ≈ $0.025
        USDT: 0.025,        // 1 GALA ≈ $0.025  
        WBTC: 0.00000025,   // 1 GALA ≈ 0.00000025 WBTC
        WETH: 0.0000075,    // 1 GALA ≈ 0.0000075 WETH
        WEN: 250.0,         // 1 GALA ≈ 250 WEN
        '$GMUSIC': 0.8,     // 1 GALA ≈ 0.8 $GMUSIC
        FILM: 1.2,          // 1 GALA ≈ 1.2 FILM
        WXRP: 0.04          // 1 GALA ≈ 0.04 WXRP
      },
      USDC: { 
        GALA: 40.0, USDT: 1.0, WBTC: 0.00001, WETH: 0.0003, 
        WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 1.6
      },
      USDT: { 
        GALA: 40.0, USDC: 1.0, WBTC: 0.00001, WETH: 0.0003,
        WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 1.6
      },
      WBTC: { 
        GALA: 4000000.0, USDC: 100000.0, USDT: 100000.0, WETH: 30.0,
        WEN: 1000000000.0, '$GMUSIC': 128000.0, FILM: 192000.0, WXRP: 160000.0
      },
      WETH: { 
        GALA: 133333.0, USDC: 3333.0, USDT: 3333.0, WBTC: 0.033,
        WEN: 33333333.0, '$GMUSIC': 4266.0, FILM: 6400.0, WXRP: 5333.0
      },
      WEN: { 
        GALA: 0.004, USDC: 0.0001, USDT: 0.0001, WBTC: 0.000000001, WETH: 0.00000003,
        '$GMUSIC': 0.0032, FILM: 0.0048, WXRP: 0.00016
      },
      '$GMUSIC': { 
        GALA: 1.25, USDC: 0.03125, USDT: 0.03125, WBTC: 0.0000000078, WETH: 0.0000234,
        WEN: 312.5, FILM: 1.5, WXRP: 0.05
      },
      FILM: { 
        GALA: 0.833, USDC: 0.02083, USDT: 0.02083, WBTC: 0.0000000052, WETH: 0.000156,
        WEN: 208.3, '$GMUSIC': 0.667, WXRP: 0.033
      },
      WXRP: { 
        GALA: 25.0, USDC: 0.625, USDT: 0.625, WBTC: 0.00000625, WETH: 0.0001875,
        WEN: 6250.0, '$GMUSIC': 20.0, FILM: 30.0
      }
    };
    return rates[from]?.[to] || 1;
  };

  const getExecutionPrice = (from: string, to: string, fromAmount: string) => {
    // Simulate price impact based on trade size
    const midPrice = getExchangeRate(from, to);
    const amount = Number(fromAmount);
    
    if (amount === 0) return midPrice;
    
    // Simulate higher execution price for larger trades (positive price impact)
    const impactFactor = Math.sqrt(amount) * 0.001; // Simple impact model
    return midPrice * (1 + impactFactor);
  };

  const calculatePriceImpact = (midPrice: number, executionPrice: number): number => {
    if (midPrice === 0) return 0;
    const impact = ((executionPrice - midPrice) / midPrice) * 100;
    // Round to 6 decimal places to eliminate floating point precision errors
    return Math.round(impact * 1000000) / 1000000;
  };

  const calculateToAmount = (fromAmount: string, fromToken: string, toToken: string) => {
    if (!fromAmount || isNaN(Number(fromAmount))) return '';
    const executionPrice = getExecutionPrice(fromToken, toToken, fromAmount);
    const amount = Number(fromAmount) * executionPrice;
    return amount === 0 ? '0' : amount.toFixed(6);
  };

  const calculateFromAmount = (toAmount: string, fromToken: string, toToken: string) => {
    if (!toAmount || isNaN(Number(toAmount))) return '';
    
    const targetAmount = Number(toAmount);
    const midPrice = getExchangeRate(fromToken, toToken);
    
    // Start with mid-price estimate
    let estimate = targetAmount / midPrice;
    
    // Use iterative approach to find the fromAmount that yields the desired toAmount
    // accounting for price impact
    for (let i = 0; i < 5; i++) {
      const executionPrice = getExecutionPrice(fromToken, toToken, estimate.toString());
      const calculatedTo = estimate * executionPrice;
      const error = calculatedTo - targetAmount;
      
      if (Math.abs(error) < 0.000001) break;
      
      // Adjust estimate using Newton's method approximation
      estimate = estimate - (error / executionPrice);
      estimate = Math.max(0, estimate); // Ensure non-negative
    }
    
    return estimate.toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    const toAmount = calculateToAmount(value, swap.fromToken, swap.toToken);
    const midPrice = getExchangeRate(swap.fromToken, swap.toToken);
    const executionPrice = getExecutionPrice(swap.fromToken, swap.toToken, value);
    const priceImpact = value && !isNaN(Number(value)) && Number(value) > 0 
      ? calculatePriceImpact(midPrice, executionPrice) 
      : null;

    setSwap(prev => ({
      ...prev,
      fromAmount: value,
      toAmount,
      midPrice,
      executionPrice,
      priceImpact,
    }));
  };

  const handleToAmountChange = (value: string) => {
    const fromAmount = calculateFromAmount(value, swap.fromToken, swap.toToken);
    const midPrice = getExchangeRate(swap.fromToken, swap.toToken);
    const executionPrice = getExecutionPrice(swap.fromToken, swap.toToken, fromAmount);
    const priceImpact = fromAmount && !isNaN(Number(fromAmount)) && Number(fromAmount) > 0 
      ? calculatePriceImpact(midPrice, executionPrice) 
      : null;

    setSwap(prev => ({
      ...prev,
      toAmount: value,
      fromAmount,
      midPrice,
      executionPrice,
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
      // Simulate swap execution
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
        midPrice: null,
        executionPrice: null,
        isLoading: false,
      }));
    } catch (error) {
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
            <CardTitle>Swap Tokens</CardTitle>
            <CardDescription>Trade your tokens instantly</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <Label htmlFor="from-amount">From</Label>
          <div className="flex gap-2">
            <div className="flex-1">
          <Input
            id="from-amount"
            type="number"
            placeholder="0.00"
            value={swap.fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            aria-label="From"
          />
            </div>
            <Select
              value={swap.fromToken}
              onValueChange={(value) => {
                setSwap(prev => ({ ...prev, fromToken: value }));
                // Recalculate when from token changes
                if (swap.fromAmount) {
                  const toAmount = calculateToAmount(swap.fromAmount, value, swap.toToken);
                  const midPrice = getExchangeRate(value, swap.toToken);
                  const executionPrice = getExecutionPrice(value, swap.toToken, swap.fromAmount);
                  const priceImpact = calculatePriceImpact(midPrice, executionPrice);
                  setSwap(prev => ({ ...prev, toAmount, midPrice, executionPrice, priceImpact }));
                }
              }}
            >
              <SelectTrigger className="w-24" role="combobox">
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
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Balance: {getTokenBalance(swap.fromToken)}</span>
            <Button variant="link" className="h-auto p-0 text-xs">
              MAX
            </Button>
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

        {/* To Token */}
        <div className="space-y-2">
          <Label htmlFor="to-amount">To</Label>
          <div className="flex gap-2">
            <div className="flex-1">
          <Input
            id="to-amount"
            type="number"
            placeholder="0.00"
            value={swap.toAmount}
            onChange={(e) => handleToAmountChange(e.target.value)}
            aria-label="To"
          />
            </div>
            <Select
              value={swap.toToken}
              onValueChange={(value) => {
                setSwap(prev => ({ ...prev, toToken: value }));
                // Recalculate when to token changes
                if (swap.fromAmount) {
                  const toAmount = calculateToAmount(swap.fromAmount, swap.fromToken, value);
                  const midPrice = getExchangeRate(swap.fromToken, value);
                  const executionPrice = getExecutionPrice(swap.fromToken, value, swap.fromAmount);
                  const priceImpact = calculatePriceImpact(midPrice, executionPrice);
                  setSwap(prev => ({ ...prev, toAmount, midPrice, executionPrice, priceImpact }));
                }
              }}
            >
              <SelectTrigger className="w-24" role="combobox">
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
          </div>
          <div className="text-sm text-muted-foreground">
            Balance: {getTokenBalance(swap.toToken)}
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
            {swap.priceImpact !== null && (
              <div className="flex justify-between text-sm">
                <span>Price Impact:</span>
                <Badge 
                  variant={Math.abs(swap.priceImpact) > 5 ? "destructive" : Math.abs(swap.priceImpact) > 1 ? "secondary" : "outline"}
                  data-testid="price-impact-badge"
                >
                  {swap.priceImpact > 0 ? '+' : ''}{swap.priceImpact.toFixed(3)}%
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
          {swap.isLoading ? 'Swapping...' : 'Swap'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SwapInterface;