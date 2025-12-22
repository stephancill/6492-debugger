import {
	arbitrum,
	base,
	baseSepolia,
	mainnet,
	optimism,
	polygon,
	sepolia,
} from "viem/chains";

export const chains = [
	mainnet,
	sepolia,
	optimism,
	arbitrum,
	polygon,
	base,
	baseSepolia,
];

export const getChain = (chainId: number) =>
	chains.find((c) => c.id === chainId);
