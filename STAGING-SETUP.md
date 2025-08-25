# Staging Environment Setup Guide

This guide explains how to set up and use your Gala DEX on the staging environment at `https://dex-frontend-test1.defi.gala.com/`.

## 🌐 Domain Setup

### DNS Configuration
1. **Add A Record** at your DNS provider:
   - **Type**: A
   - **Name**: dex-frontend-test1
   - **Value**: 185.158.133.1
   - **TTL**: 300 (or default)

2. **Verify DNS Propagation**:
   - Check at [DNSChecker.org](https://dnschecker.org)
   - Wait up to 24-48 hours for full propagation

### Lovable Configuration
1. Go to your Lovable project settings → **Domains**
2. Click **Connect Domain**
3. Enter: `dex-frontend-test1.defi.gala.com`
4. Lovable will automatically provision SSL (https)

## 🔧 Environment Configuration

### Automatic Environment Detection
The application automatically detects the environment based on the hostname:

- **Development**: `localhost:*` or `*.lovable.dev`
- **Staging**: `dex-frontend-test1.defi.gala.com`
- **Production**: `dex.gala.com` or `galadefi.com`

### Environment-Specific Features

#### Staging Environment
- **Network**: Goerli Test Network
- **Visual Indicators**: Orange "STAGING" badge in top-right corner
- **Wallet Integration**: Automatic network switching to Goerli
- **Test Accounts**: Enabled for testing
- **Debug Info**: Visible for troubleshooting

#### Visual Indicators
- **Environment Badge**: Shows current environment in top-right
- **Network Badge**: Displays current blockchain network
- **Title**: Shows "Staging Environment" subtitle on staging

## 🦊 MetaMask Setup for Staging

### Network Configuration
When connecting to staging, the app will automatically:
1. Prompt to switch to Goerli Test Network
2. Add the network if it doesn't exist
3. Configure the following settings:

```
Network Name: Goerli Test Network
RPC URL: https://eth-goerli.g.alchemy.com/v2/demo
Chain ID: 5 (0x5)
Block Explorer: https://goerli.etherscan.io
```

### Getting Testnet ETH
1. **Goerli Faucet**: Visit [goerlifaucet.com](https://goerlifaucet.com)
2. **Alchemy Faucet**: Use [goerli-faucet.mudit.blog](https://goerli-faucet.mudit.blog)
3. **Chainlink Faucet**: Visit [faucets.chain.link](https://faucets.chain.link)

### Test Token Addresses (Staging)
Update these in `src/config/environment.ts` with your actual staging contract addresses:

```typescript
contracts: {
  galaToken: '0x0000000000000000000000000000000000000002', // Replace with actual staging GALA
  usdcToken: '0x0000000000000000000000000000000000000003', // Replace with actual staging USDC
  ethToken: '0x0000000000000000000000000000000000000000', // ETH (native)
  townToken: '0x0000000000000000000000000000000000000004', // Replace with actual staging TOWN
  swapRouter: '0x0000000000000000000000000000000000000005', // Replace with actual staging router
}
```

## 🧪 Testing Features

### Staging-Specific Features
- **Test Accounts**: Available for automated testing
- **Debug Information**: Environment details shown in wallet component
- **Network Validation**: Automatic network switching
- **Transaction Simulation**: Safe testing environment

### Available Test Functions
1. **Wallet Connection**: Test MetaMask integration
2. **Network Switching**: Automatic Goerli network setup
3. **Token Swapping**: Test with staging token contracts
4. **Balance Display**: View testnet balances
5. **Error Handling**: Test various error scenarios

## 🔍 Debugging & Monitoring

### Browser Console Logs
The staging environment provides detailed logging:
```
🌍 Environment: Staging {
  hostname: "dex-frontend-test1.defi.gala.com",
  config: { /* environment config */ }
}
```

### Environment Variables
No environment variables needed - configuration is automatic based on hostname.

### Common Issues & Solutions

#### DNS Not Propagating
- **Issue**: Domain doesn't resolve to Lovable
- **Solution**: Wait 24-48 hours, check DNS settings
- **Debug**: Use `nslookup dex-frontend-test1.defi.gala.com`

#### SSL Certificate Issues
- **Issue**: "Not Secure" warning in browser
- **Solution**: Wait for Lovable's automatic SSL provisioning
- **Timeline**: Usually 10-30 minutes after DNS propagation

#### MetaMask Network Issues
- **Issue**: Wrong network selected
- **Solution**: App will automatically prompt to switch
- **Manual**: Settings → Networks → Add Goerli Test Network

#### Test Tokens Not Available
- **Issue**: No testnet tokens for trading
- **Solution**: Get testnet ETH from faucets, then get test tokens
- **Note**: Update contract addresses in environment config

## 📋 Pre-Launch Checklist

### Domain Setup ✅
- [ ] DNS A record added (185.158.133.1)
- [ ] Domain added in Lovable project settings
- [ ] DNS propagation complete (check DNSChecker.org)
- [ ] SSL certificate active (https working)

### Application Configuration ✅
- [ ] Environment detection working (check console logs)
- [ ] Staging badges visible in UI
- [ ] MetaMask connects to Goerli network
- [ ] Test accounts feature enabled

### Testing ✅
- [ ] Wallet connection works
- [ ] Network switching works
- [ ] Token balance display works
- [ ] Swap interface loads
- [ ] Error handling works
- [ ] Mobile responsive

### Smart Contracts ✅
- [ ] Staging contracts deployed on Goerli
- [ ] Contract addresses updated in environment config
- [ ] Test tokens available for trading
- [ ] Swap router configured

## 🚀 Deployment

Once staging testing is complete:
1. Update contract addresses in environment config
2. Test all functionality thoroughly
3. Ready for production deployment

## 📞 Support

If you encounter issues:
1. Check browser console for detailed logs
2. Verify DNS settings with tools like DNSChecker
3. Ensure MetaMask is on Goerli network
4. Contact Lovable support with domain name and screenshots

---

**Environment Status**: 
- 🟡 **Staging**: `dex-frontend-test1.defi.gala.com`
- 🟢 **Production**: Not yet configured