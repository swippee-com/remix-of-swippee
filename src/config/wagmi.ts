import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, bsc, polygon } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Swippee",
  projectId: "00000000000000000000000000000000", // WalletConnect fallback — optional for injected wallets
  chains: [mainnet, bsc, polygon],
  ssr: false,
});

/**
 * Maps our internal network enum to wagmi chain IDs.
 * TRC20 (Tron) is not EVM-compatible and cannot be verified via wagmi.
 */
export const networkToChainId: Record<string, number | null> = {
  ERC20: mainnet.id,   // 1
  BEP20: bsc.id,       // 56
  Polygon: polygon.id, // 137
  TRC20: null,         // Not EVM — cannot verify
};
