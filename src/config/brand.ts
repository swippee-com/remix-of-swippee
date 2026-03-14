export const BRAND = {
  name: "Swippee",
  tagline: "Your Trusted OTC Crypto Desk",
  description: "Secure, quote-based crypto trading with manual settlement. Buy and sell crypto with confidence through our OTC desk.",
  supportEmail: "support@swippee.com",
  supportedAssets: ["USDT", "BTC", "ETH", "USDC"] as const,
  supportedNetworks: ["TRC20", "ERC20", "BEP20", "Polygon"] as const,
  defaultFiatCurrency: "NPR",
  supportedFiatCurrencies: ["NPR", "INR", "USD"] as const,
  paymentMethods: [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "esewa", label: "eSewa" },
    { value: "khalti", label: "Khalti" },
    { value: "ime_pay", label: "IME Pay" },
    { value: "other", label: "Other" },
  ] as const,
} as const;

export type SupportedAsset = typeof BRAND.supportedAssets[number];
export type SupportedNetwork = typeof BRAND.supportedNetworks[number];
export type FiatCurrency = typeof BRAND.supportedFiatCurrencies[number];
