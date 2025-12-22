import { useMemo } from "react";
import { type Address, encodeFunctionData, type Hex } from "viem";
import { getChain } from "../utils/chains";

// ERC-1271 isValidSignature ABI
const isValidSignatureAbi = [
	{
		name: "isValidSignature",
		type: "function",
		inputs: [
			{ name: "hash", type: "bytes32" },
			{ name: "signature", type: "bytes" },
		],
		outputs: [{ name: "", type: "bytes4" }],
	},
] as const;

// Multicall3 aggregate3 ABI
const multicall3Abi = [
	{
		name: "aggregate3",
		type: "function",
		inputs: [
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "allowFailure", type: "bool" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{
				name: "returnData",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},
] as const;

type Decoded6492Signature = {
	create2Factory: string;
	factoryCalldata: string;
	originalERC1271Signature: string;
};

export type VerificationCallData = {
	type: "multicall" | "direct";
	to: Address;
	data: Hex;
	tenderlyUrl: string;
};

export function useVerificationCallData(
	decodedSignature: Decoded6492Signature | null,
	address: string,
	signature: string,
	messageHash: Hex | null,
	chainId: number,
): VerificationCallData | null {
	return useMemo(() => {
		if (!address || !messageHash || !signature) return null;

		const chain = getChain(chainId);

		try {
			// Get the signature to verify - use original ERC1271 signature if 6492, otherwise raw signature
			const signatureToVerify = decodedSignature
				? (decodedSignature.originalERC1271Signature as Hex)
				: (signature as Hex);

			// Encode the isValidSignature call
			const isValidSignatureCalldata = encodeFunctionData({
				abi: isValidSignatureAbi,
				functionName: "isValidSignature",
				args: [messageHash, signatureToVerify],
			});

			// If we have a 6492 signature, use multicall to deploy + verify
			if (decodedSignature) {
				const multicallAddress = chain?.contracts?.multicall3?.address;
				if (!multicallAddress) return null;

				// Build the multicall3 aggregate3 call
				const calls = [
					{
						target: decodedSignature.create2Factory as Address,
						allowFailure: false,
						callData: decodedSignature.factoryCalldata as Hex,
					},
					{
						target: address as Address,
						allowFailure: false,
						callData: isValidSignatureCalldata,
					},
				];

				const multicallCalldata = encodeFunctionData({
					abi: multicall3Abi,
					functionName: "aggregate3",
					args: [calls],
				});

				// Build Tenderly simulation URL
				const tenderlyParams = new URLSearchParams({
					from: "0x0000000000000000000000000000000000000001",
					contractAddress: multicallAddress,
					rawFunctionInput: multicallCalldata,
					network: String(chainId),
					gas: "25000000",
				});
				const tenderlyUrl = `https://ajhodges.github.io/tdly-redirect/?${tenderlyParams.toString()}`;

				return {
					type: "multicall",
					to: multicallAddress,
					data: multicallCalldata,
					tenderlyUrl,
				};
			}

			// For non-6492 signatures, just do a direct isValidSignature call
			const tenderlyParams = new URLSearchParams({
				from: "0x0000000000000000000000000000000000000001",
				contractAddress: address,
				rawFunctionInput: isValidSignatureCalldata,
				network: String(chainId),
				gas: "25000000",
			});
			const tenderlyUrl = `https://ajhodges.github.io/tdly-redirect/?${tenderlyParams.toString()}`;

			return {
				type: "direct",
				to: address as Address,
				data: isValidSignatureCalldata,
				tenderlyUrl,
			};
		} catch (e) {
			console.error("Error encoding verification call:", e);
			return null;
		}
	}, [decodedSignature, address, signature, messageHash, chainId]);
}
