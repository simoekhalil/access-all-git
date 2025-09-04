import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Real GalaSwap tokens as per official documentation
const TOKENS = [
  { symbol: 'GALA', name: 'Gala', balance: '1,000.00' },
  { symbol: 'ETIME', name: 'Eternal Time', balance: '500.00' },
  { symbol: 'SILK', name: 'Silk', balance: '250.00' },
  { symbol: 'MTRM', name: 'Materium', balance: '100.00' },
  { symbol: 'GUSDT', name: 'Gala USD Tether', balance: '1,200.00' },
  { symbol: 'GUSDC', name: 'Gala USD Coin', balance: '1,500.00' },
  { symbol: 'GWETH', name: 'Gala Wrapped Ethereum', balance: '0.75' },
];

interface SwapState {
  offeringToken: string;
  wantedToken: string;
  offeringAmount: string;
  wantedAmount: string;
  slippage: string;
  isLoading: boolean;
  gasFeeCost: number; // Fixed 1 GALA per transaction
}

const SwapInterface = () => {
  const [swap, setSwap] = useState<SwapState>({
    offeringToken: 'GALA',
    wantedToken: 'GUSDC',
    offeringAmount: '',
    wantedAmount: '',
    slippage: '0.5',
    isLoading: false,
    gasFeeCost: 1, // 1 GALA gas fee
  });
  const { toast } = useToast();

  const handleSwapTokens = () => {
    setSwap(prev => ({
      ...prev,
      offeringToken: prev.wantedToken,
      wantedToken: prev.offeringToken,
      offeringAmount: prev.wantedAmount,
      wantedAmount: prev.offeringAmount,
    }));
  };

  // In real GalaSwap, all pairs trade through GALA as base
  const getExchangeRate = (offering: string, wanted: string) => {
    // Mock exchange rates for P2P offers (these would come from actual orders)
    const galaRates: Record<string, number> = {
      ETIME: 0.05,    // 1 GALA = 0.05 ETIME
      SILK: 0.08,     // 1 GALA = 0.08 SILK  
      MTRM: 0.12,     // 1 GALA = 0.12 MTRM
      GUSDT: 0.025,   // 1 GALA = 0.025 GUSDT
      GUSDC: 0.025,   // 1 GALA = 0.025 GUSDC
      GWETH: 0.000008, // 1 GALA = 0.000008 GWETH
    };

    if (offering === 'GALA') return galaRates[wanted] || 1;
    if (wanted === 'GALA') return 1 / (galaRates[offering] || 1);
    
    // For non-GALA pairs, calculate through GALA (real GalaSwap requires 2 transactions)
    return (galaRates[wanted] || 1) / (galaRates[offering] || 1);
  };

  const calculateWantedAmount = (offeringAmount: string, offeringToken: string, wantedToken: string) => {
    if (!offeringAmount || isNaN(Number(offeringAmount))) return '';
    const rate = getExchangeRate(offeringToken, wantedToken);
    const amount = Number(offeringAmount) * rate;
    return amount.toFixed(6);
  };

  const calculateOfferingAmount = (wantedAmount: string, offeringToken: string, wantedToken: string) => {
    if (!wantedAmount || isNaN(Number(wantedAmount))) return '';
    const rate = getExchangeRate(offeringToken, wantedToken);
    const amount = Number(wantedAmount) / rate;
    return amount.toFixed(6);
  };

  const handleOfferingAmountChange = (value: string) => {
    const wantedAmount = calculateWantedAmount(value, swap.offeringToken, swap.wantedToken);
    setSwap(prev => ({
      ...prev,
      offeringAmount: value,
      wantedAmount,
    }));
  };

  const handleWantedAmountChange = (value: string) => {
    const offeringAmount = calculateOfferingAmount(value, swap.offeringToken, swap.wantedToken);
    setSwap(prev => ({
      ...prev,
      wantedAmount: value,
      offeringAmount,
    }));
  };

  const createOffer = async () => {
    const offeringAmountNum = Number(swap.offeringAmount);
    const wantedAmountNum = Number(swap.wantedAmount);

    if (!swap.offeringAmount || !swap.wantedAmount || offeringAmountNum <= 0 || wantedAmountNum <= 0 || isNaN(offeringAmountNum) || isNaN(wantedAmountNum)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter valid amounts for your offer.",
        variant: "destructive",
      });
      return;
    }

    setSwap(prev => ({ ...prev, isLoading: true }));

    try {
      // Simulate P2P offer creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Offer Created",
        description: `Created offer: ${swap.offeringAmount} ${swap.offeringToken} for ${swap.wantedAmount} ${swap.wantedToken}`,
      });

      // Reset form
      setSwap(prev => ({
        ...prev,
        offeringAmount: '',
        wantedAmount: '',
        isLoading: false,
      }));
    } catch (error) {
      toast({
        title: "Offer Failed",
        description: "There was an error creating your offer. Please try again.",
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
            <CardTitle>Create Offer</CardTitle>
            <CardDescription>Create a P2P token swap offer</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Offering Token */}
        <div className="space-y-2">
          <Label htmlFor="offering-amount">Offering</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="offering-amount"
                type="number"
                placeholder="0.00"
                value={swap.offeringAmount}
                onChange={(e) => handleOfferingAmountChange(e.target.value)}
                aria-label="Offering"
              />
            </div>
            <Select
              value={swap.offeringToken}
              onValueChange={(value) => {
                setSwap(prev => ({ ...prev, offeringToken: value }));
                if (swap.offeringAmount) {
                  const wantedAmount = calculateWantedAmount(swap.offeringAmount, value, swap.wantedToken);
                  setSwap(prev => ({ ...prev, wantedAmount }));
                }
              }}
            >
              <SelectTrigger className="w-32" role="combobox">
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
            <span>Balance: {getTokenBalance(swap.offeringToken)}</span>
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

        {/* Wanted Token */}
        <div className="space-y-2">
          <Label htmlFor="wanted-amount">Wanted</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="wanted-amount"
                type="number"
                placeholder="0.00"
                value={swap.wantedAmount}
                onChange={(e) => handleWantedAmountChange(e.target.value)}
                aria-label="Wanted"
              />
            </div>
            <Select
              value={swap.wantedToken}
              onValueChange={(value) => {
                setSwap(prev => ({ ...prev, wantedToken: value }));
                if (swap.offeringAmount) {
                  const wantedAmount = calculateWantedAmount(swap.offeringAmount, swap.offeringToken, value);
                  setSwap(prev => ({ ...prev, wantedAmount }));
                }
              }}
            >
              <SelectTrigger className="w-32" role="combobox">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.filter(token => token.symbol !== swap.offeringToken).map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Balance: {getTokenBalance(swap.wantedToken)}
          </div>
        </div>

        {/* Offer Details */}
        {swap.offeringAmount && swap.wantedAmount && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Exchange Rate:</span>
              <span>1 {swap.offeringToken} = {(Number(swap.wantedAmount) / Number(swap.offeringAmount)).toFixed(6)} {swap.wantedToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Slippage Tolerance:</span>
              <Badge variant="secondary">{swap.slippage}%</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Gas Fee:</span>
              <Badge variant="outline">{swap.gasFeeCost} GALA</Badge>
            </div>
          </div>
        )}

        {/* Create Offer Button */}
        <Button 
          onClick={createOffer} 
          disabled={
            !swap.offeringAmount || 
            !swap.wantedAmount || 
            Number(swap.offeringAmount) <= 0 || 
            Number(swap.wantedAmount) <= 0 || 
            isNaN(Number(swap.offeringAmount)) || 
            isNaN(Number(swap.wantedAmount)) || 
            swap.isLoading
          }
          className="w-full"
          size="lg"
        >
          {swap.isLoading ? 'Creating Offer...' : 'Create Offer'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SwapInterface;