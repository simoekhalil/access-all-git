import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ENV } from '@/config/environment';

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
      const error = "Please install MetaMask or another Web3 wallet.";
      setWallet(prev => ({ ...prev, error, isLoading: false }));
      toast({
        title: "Wallet Not Found",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if we need to switch networks
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId !== ENV.walletConfig.networkId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ENV.walletConfig.networkId }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: ENV.walletConfig.networkId,
                chainName: ENV.walletConfig.networkName,
                rpcUrls: [ENV.walletConfig.rpcUrl],
                blockExplorerUrls: [ENV.walletConfig.blockExplorer],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          isLoading: false,
        }));

        await getBalance(accounts[0]);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${ENV.walletConfig.networkName}`,
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWallet(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
      toast({
        title: "Connection Failed",
        description: error.message,
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
      
      // Convert from wei to ETH
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      setWallet(prev => ({
        ...prev,
        balance: ethBalance.toFixed(4),
      }));
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
      description: "Your wallet has been disconnected",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Gala Wallet
          {ENV.isStaging && (
            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
              {ENV.walletConfig.networkName}
            </Badge>
          )}
          {ENV.isDevelopment && (
            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
              DEV
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {ENV.isStaging ? 
            "Connect your wallet to start trading on staging" : 
            "Connect your wallet to start trading"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallet.error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
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
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected
              </Badge>
              {ENV.features.showDebugInfo && (
                <Badge variant="outline" className="text-xs">
                  {ENV.name}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-mono">{formatAddress(wallet.address!)}</span>
              </div>
              {wallet.balance && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-mono">{wallet.balance} ETH</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span className="text-xs">{ENV.walletConfig.networkName}</span>
              </div>
            </div>

            <Button 
              onClick={disconnectWallet} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        )}

        {ENV.features.enableTestAccounts && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            💡 Test accounts available for {ENV.name.toLowerCase()} environment
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnection;