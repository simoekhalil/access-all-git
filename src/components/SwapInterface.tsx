import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TOKENS = [
  { symbol: 'GALA', name: 'Gala', balance: '1,000.00' },
  { symbol: 'USDC', name: 'USD Coin', balance: '500.00' },
  { symbol: 'ETH', name: 'Ethereum', balance: '2.50' },
  { symbol: 'TOWN', name: 'Town Coin', balance: '10,000.00' },
];

interface SwapState {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: string;
  isLoading: boolean;
}

const SwapInterface = () => {
  const [swap, setSwap] = useState<SwapState>({
    fromToken: 'GALA',
    toToken: 'USDC',
    fromAmount: '',
    toAmount: '',
    slippage: '0.5',
    isLoading: false,
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
      
      // Recalculate amounts with new token pair if there's a fromAmount
      if (newState.fromAmount && !isNaN(Number(newState.fromAmount))) {
        newState.toAmount = calculateToAmount(newState.fromAmount, newState.fromToken, newState.toToken);
      }
      
      return newState;
    });
  };

  const handleFromTokenChange = (value: string) => {
    setSwap(prev => {
      const newState = { ...prev, fromToken: value };
      // Recalculate toAmount if fromAmount exists
      if (prev.fromAmount && !isNaN(Number(prev.fromAmount))) {
        newState.toAmount = calculateToAmount(prev.fromAmount, value, prev.toToken);
      }
      return newState;
    });
  };

  const handleToTokenChange = (value: string) => {
    setSwap(prev => {
      const newState = { ...prev, toToken: value };
      // Recalculate toAmount if fromAmount exists
      if (prev.fromAmount && !isNaN(Number(prev.fromAmount))) {
        newState.toAmount = calculateToAmount(prev.fromAmount, prev.fromToken, value);
      }
      return newState;
    });
  };

  const getExchangeRate = (from: string, to: string) => {
    // Mock exchange rates
    const rates: Record<string, Record<string, number>> = {
      GALA: { USDC: 0.025, ETH: 0.000015, TOWN: 0.1 },
      USDC: { GALA: 40, ETH: 0.0006, TOWN: 4 },
      ETH: { GALA: 66666.67, USDC: 1666.67, TOWN: 6666.67 },
      TOWN: { GALA: 10, USDC: 0.25, ETH: 0.00015 },
    };
    return rates[from]?.[to] || 1;
  };

  const calculateToAmount = (fromAmount: string, fromToken: string, toToken: string) => {
    if (!fromAmount || isNaN(Number(fromAmount))) return '';
    const rate = getExchangeRate(fromToken, toToken);
    const amount = Number(fromAmount) * rate;
    return amount.toFixed(6);
  };

  const calculateFromAmount = (toAmount: string, fromToken: string, toToken: string) => {
    if (!toAmount || isNaN(Number(toAmount))) return '';
    const rate = getExchangeRate(fromToken, toToken);
    const amount = Number(toAmount) / rate;
    return amount.toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setSwap(prev => ({
      ...prev,
      fromAmount: value,
      toAmount: calculateToAmount(value, prev.fromToken, prev.toToken),
    }));
  };

  const handleToAmountChange = (value: string) => {
    setSwap(prev => ({
      ...prev,
      toAmount: value,
      fromAmount: calculateFromAmount(value, prev.fromToken, prev.toToken),
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
          <Button variant="ghost" size="sm" aria-label="Swap settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2" role="group" aria-labelledby="from-token-label">
          <Label htmlFor="from-amount" id="from-token-label">From</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="from-amount"
                type="number"
                placeholder="0.00"
                value={swap.fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                aria-describedby="from-balance"
                min="0"
                step="0.000001"
              />
            </div>
            <Select
              value={swap.fromToken}
              onValueChange={handleFromTokenChange}
              aria-label="Select from token"
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
            <span id="from-balance">Balance: {getTokenBalance(swap.fromToken)}</span>
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs"
              onClick={() => handleFromAmountChange(getTokenBalance(swap.fromToken))}
              aria-label={`Use maximum balance of ${getTokenBalance(swap.fromToken)} ${swap.fromToken}`}
            >
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
            className="rounded-full p-2 hover-scale"
            data-testid="swap-direction-button"
            aria-label={`Swap direction: ${swap.fromToken} to ${swap.toToken}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2" role="group" aria-labelledby="to-token-label">
          <Label htmlFor="to-amount" id="to-token-label">To</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="to-amount"
                type="number"
                placeholder="0.00"
                value={swap.toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                aria-describedby="to-balance"
                min="0"
                step="0.000001"
              />
            </div>
            <Select
              value={swap.toToken}
              onValueChange={handleToTokenChange}
              aria-label="Select to token"
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
            <span id="to-balance">Balance: {getTokenBalance(swap.toToken)}</span>
          </div>
        </div>

        {/* Swap Details */}
        {swap.fromAmount && swap.toAmount && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg card-elevated" role="region" aria-label="Swap details">
            <div className="flex justify-between text-sm">
              <span>Exchange Rate:</span>
              <span>1 {swap.fromToken} = {(Number(swap.toAmount) / Number(swap.fromAmount)).toFixed(6)} {swap.toToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Slippage Tolerance:</span>
              <Badge variant="secondary">{swap.slippage}%</Badge>
            </div>
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
          className="w-full btn-gradient"
          size="lg"
          aria-describedby={swap.isLoading ? "swap-loading" : undefined}
        >
          {swap.isLoading ? (
            <>
              <span className="loading-shimmer inline-block w-4 h-4 rounded mr-2" />
              <span id="swap-loading">Swapping...</span>
            </>
          ) : (
            'Swap'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SwapInterface;