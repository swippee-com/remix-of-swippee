export const en = {
  // Navigation
  "nav.overview": "Overview",
  "nav.wallet": "Wallet",
  "nav.portfolio": "Portfolio",
  "nav.kyc": "KYC",
  "nav.quotes": "Quote Requests",
  "nav.trades": "Trades",
  "nav.paymentMethods": "Payment Methods",
  "nav.payoutAddresses": "Payout Addresses",
  "nav.support": "Support",
  "nav.settings": "Settings",
  "nav.signOut": "Sign Out",

  // Dashboard Overview
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome back! Here's your account overview.",
  "dashboard.newQuote": "New Quote",
  "dashboard.walletBalance": "Wallet Balance",
  "dashboard.availableBalance": "Available balance",
  "dashboard.kycStatus": "KYC Status",
  "dashboard.identityVerified": "Identity verified",
  "dashboard.activeTrades": "Active Trades",
  "dashboard.inProgress": "In progress",
  "dashboard.completedTrades": "Completed Trades",
  "dashboard.paymentMethods": "Payment Methods",
  "dashboard.recentActivity": "Recent Activity",
  "dashboard.noActivity": "No recent activity yet.",
  "dashboard.quoteRequest": "Quote Request",
  "dashboard.trade": "Trade",

  // Portfolio
  "portfolio.title": "Portfolio",
  "portfolio.description": "Track your crypto holdings and performance from completed trades.",
  "portfolio.totalValue": "Total Portfolio Value",
  "portfolio.totalPL": "Total P&L",
  "portfolio.assetsHeld": "Assets Held",
  "portfolio.completedTrades": "Completed Trades",
  "portfolio.holdings": "Holdings",
  "portfolio.tradeHistory": "Trade History",
  "portfolio.yourHoldings": "Your Holdings",
  "portfolio.noHoldings": "No holdings yet",
  "portfolio.noHoldingsDesc": "Complete a buy trade to see your portfolio here.",
  "portfolio.completedTradesTitle": "Completed Trades",
  "portfolio.noTrades": "No completed trades",
  "portfolio.noTradesDesc": "Your completed trades will appear here.",
  "portfolio.asset": "Asset",
  "portfolio.quantity": "Quantity",
  "portfolio.avgCost": "Avg Cost",
  "portfolio.currentPrice": "Current Price",
  "portfolio.value": "Value",
  "portfolio.24h": "24h",
  "portfolio.pl": "P&L",
  "portfolio.date": "Date",
  "portfolio.type": "Type",
  "portfolio.network": "Network",
  "portfolio.amount": "Amount",
  "portfolio.rate": "Rate",
  "portfolio.total": "Total",
  "portfolio.none": "None",

  // Settings
  "settings.title": "Settings",
  "settings.description": "Manage your account settings.",
  "settings.language": "Language",
  "settings.languageDesc": "Choose your preferred language.",
  "settings.appearance": "Appearance",
  "settings.appearanceDesc": "Choose your preferred theme.",
  "settings.light": "Light",
  "settings.dark": "Dark",
  "settings.system": "System",
  "settings.profile": "Profile",
  "settings.fullName": "Full Name",
  "settings.email": "Email",
  "settings.phone": "Phone",
  "settings.country": "Country",
  "settings.saveChanges": "Save Changes",
  "settings.saving": "Saving…",
  "settings.security": "Security",
  "settings.newPassword": "New Password",
  "settings.confirmPassword": "Confirm New Password",
  "settings.updatePassword": "Update Password",
  "settings.updating": "Updating…",
  "settings.minChars": "Min 6 characters",
  "settings.activeSessions": "Active Sessions",
  "settings.loginHistory": "Login History",
  "settings.usage": "Usage",

  // Wallet
  "wallet.title": "Wallet",
  "wallet.description": "Manage your NPR wallet balance.",

  // KYC
  "kyc.title": "KYC Verification",
  "kyc.description": "Complete your identity verification.",

  // Quotes
  "quotes.title": "Quote Requests",
  "quotes.description": "View and manage your quote requests.",
  "quotes.new": "New Quote Request",

  // Trades
  "trades.title": "Trades",
  "trades.description": "View your trade history.",

  // Payment Methods
  "paymentMethods.title": "Payment Methods",
  "paymentMethods.description": "Manage your payment methods.",

  // Payout Addresses
  "payoutAddresses.title": "Payout Addresses",
  "payoutAddresses.description": "Manage your crypto payout addresses.",

  // Support
  "support.title": "Support",
  "support.description": "Get help with your account.",

  // Common
  "common.none": "None",
  "common.loading": "Loading...",
} as const;

export type TranslationKey = keyof typeof en;
