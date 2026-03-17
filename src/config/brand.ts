export const BRAND = {
  name: "Swippee",
  tagline: "Buy & Sell Crypto in Nepal",
  description: "Buy and sell crypto in Nepal with live rates, local payment methods, and fast settlement. Instant pricing for USDT, BTC, ETH, and USDC.",
  supportEmail: "support@swippee.com",
  supportedAssets: ["USDT", "BTC", "ETH", "USDC"] as const,
  supportedNetworks: ["TRC20", "ERC20", "BEP20", "Polygon"] as const,
  defaultFiatCurrency: "NPR",
  supportedFiatCurrencies: ["NPR", "INR", "USD"] as const,
  paymentMethods: [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "esewa", label: "eSewa" },
    { value: "khalti", label: "Khalti" },
    { value: "other", label: "Other" },
  ] as const,
  paymentLogos: {
    bank_transfer: "/logos/bank-icon.png",
    esewa: "https://cdn.brandfetch.io/domain/esewa.com.np?c=1id01bgBTiGcf_p1fhi",
    khalti: "https://cdn.brandfetch.io/domain/khalti.com?c=1id01bgBTiGcf_p1fhi",
  } as Record<string, string>,
} as const;

export type SupportedAsset = typeof BRAND.supportedAssets[number];
export type SupportedNetwork = typeof BRAND.supportedNetworks[number];
export type FiatCurrency = typeof BRAND.supportedFiatCurrencies[number];
