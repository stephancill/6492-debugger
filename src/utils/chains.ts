import {
	arbitrum,
	base,
	mainnet,
	optimism,
	polygon,
	sepolia,
} from "viem/chains";

export const chains = [mainnet, sepolia, optimism, arbitrum, polygon, base];

export const getChain = (chainId: number) =>
	chains.find((c) => c.id === chainId);
