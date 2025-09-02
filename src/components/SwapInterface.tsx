import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Real GalaSwap tokens as per https://blog.gala.games/introducing-galaswap-decentralized-p2p-and-now-live-on-galachain-19e79372ea4d
const TOKENS = [
  { symbol: 'GALA', name: 'Gala', balance: '1,000.00' },
  { symbol: 'ETIME', name: 'Eternal Time', balance: '500.00' },
  { symbol: 'SILK', name: 'Silk', balance: '2.50' },
  { symbol: 'MTRM', name: 'Materium', balance: '10,000.00' },
  { symbol: 'GUSDT', name: 'Gala USD Tether', balance: '1,500.00' },
  { symbol: 'GUSDC', name: 'Gala USD Coin', balance: '1,200.00' },
  { symbol: 'GWETH', name: 'Gala Wrapped ETH', balance: '0.75' },
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
    toToken: 'ETIME',
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
    setSwap(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };

  const getExchangeRate = (from: string, to: string) => {
    // Mock exchange rates for GalaSwap tokens (mid-prices)
    const rates: Record<string, Record<string, number>> = {
      GALA: { 
        ETIME: 0.5,      // 1 GALA = 0.5 ETIME
        SILK: 0.25,      // 1 GALA = 0.25 SILK
        MTRM: 2.0,       // 1 GALA = 2.0 MTRM
        GUSDT: 0.025,    // 1 GALA = 0.025 GUSDT (~$0.025)
        GUSDC: 0.025,    // 1 GALA = 0.025 GUSDC (~$0.025)
        GWETH: 0.000008  // 1 GALA = 0.000008 GWETH
      },
      ETIME: { GALA: 2.0 },        // 1 ETIME = 2.0 GALA
      SILK: { GALA: 4.0 },         // 1 SILK = 4.0 GALA  
      MTRM: { GALA: 0.5 },         // 1 MTRM = 0.5 GALA
      GUSDT: { GALA: 40.0 },       // 1 GUSDT = 40.0 GALA
      GUSDC: { GALA: 40.0 },       // 1 GUSDC = 40.0 GALA
      GWETH: { GALA: 125000.0 },   // 1 GWETH = 125000.0 GALA
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
    return ((executionPrice - midPrice) / midPrice) * 100;
  };

  const calculateToAmount = (fromAmount: string, fromToken: string, toToken: string) => {
    if (!fromAmount || isNaN(Number(fromAmount))) return '';
    const executionPrice = getExecutionPrice(fromToken, toToken, fromAmount);
    const amount = Number(fromAmount) * executionPrice;
    return amount.toFixed(6);
  };

  const calculateFromAmount = (toAmount: string, fromToken: string, toToken: string) => {
    if (!toAmount || isNaN(Number(toAmount))) return '';
    const midPrice = getExchangeRate(fromToken, toToken);
    const amount = Number(toAmount) / midPrice;
    return amount.toFixed(6);
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

      // Reset form
      setSwap(prev => ({
        ...prev,
        fromAmount: '',
        toAmount: '',
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
              />
            </div>
            <Select
              value={swap.fromToken}
              onValueChange={(value) => setSwap(prev => ({ ...prev, fromToken: value }))}
            >
              <SelectTrigger className="w-24">
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
              />
            </div>
            <Select
              value={swap.toToken}
              onValueChange={(value) => setSwap(prev => ({ ...prev, toToken: value }))}
            >
              <SelectTrigger className="w-24">
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