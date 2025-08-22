// Centralized test selectors for consistency and maintainability
export const testSelectors = {
  // Page elements
  heading: 'Gala DEX',
  subheading: 'Trade your tokens instantly',
  
  // Wallet elements
  connectWallet: 'Connect Wallet',
  disconnect: 'Disconnect',
  connectedBadge: '[data-lov-name="Badge"]',
  walletAddress: '.text-sm.font-mono',
  
  // Swap interface
  swapTokens: 'Swap Tokens',
  swapButton: 'button[role="button"]:has-text("Swap")',
  swapDirectionButton: '[data-testid="swap-tokens-button"]',
  fromTokenSelect: '[data-testid="from-token-select"]',
  toTokenSelect: '[data-testid="to-token-select"]',
  fromAmountInput: 'input[aria-label="From"]',
  toAmountInput: 'input[aria-label="To"]',
  
  // Form labels
  fromLabel: 'From',
  toLabel: 'To',
  
  // Toast elements
  toastTitle: '[data-lov-name="ToastTitle"]',
  toastDescription: '[data-lov-name="ToastDescription"]',
  
  // Layout elements
  mainContent: 'main',
  cardElement: '.card',
  
  // Dropdown elements
  combobox: '[role="combobox"]',
  option: '[role="option"]',
  listbox: '[role="listbox"]',
  
  // Exchange rate
  exchangeRate: (from: string, to: string, rate: string) => `1 ${from} = ${rate} ${to}`,
} as const;

export const getTokenOption = (tokenSymbol: string) => `[role="option"]:has-text("${tokenSymbol}")`;

export const getExchangeRateText = (fromToken: string, toToken: string, rate: string) => 
  `1 ${fromToken} = ${rate} ${toToken}`;