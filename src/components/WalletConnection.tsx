import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

const WalletConnection = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isLoading: false,
    error: null,
  });
  const { toast } = useToast();

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setWallet(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
          }));
          await getBalance(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setWallet(prev => ({
        ...prev,
        error: 'Please install MetaMask or another Web3 wallet to connect.',
      }));
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet.",
        variant: "destructive",
      });
      return;
    }

    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          address: address,
          isLoading: false,
        }));

        // Get balance without awaiting to prevent blocking
        getBalance(address);

        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || error.toString() || 'Failed to connect wallet';
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      // Convert balance from wei to ETH (simplified for demo)
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      setWallet(prev => ({ ...prev, balance: balanceInEth }));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      balance: null,
      isLoading: false,
      error: null,
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Gala Wallet
        </CardTitle>
        <CardDescription>
          Connect your wallet to start trading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallet.error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{wallet.error}</p>
          </div>
        )}

        {!wallet.isConnected ? (
          <Button 
            onClick={connectWallet} 
            disabled={wallet.isLoading}
            className="w-full"
          >
            {wallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="default">Connected</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Address:</span>
                <span className="text-sm font-mono">
                  {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                </span>
              </div>
              
              {wallet.balance && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance:</span>
                  <span className="text-sm font-mono">{wallet.balance} ETH</span>
                </div>
              )}
            </div>

            <Button 
              onClick={disconnectWallet} 
              variant="outline" 
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnection;