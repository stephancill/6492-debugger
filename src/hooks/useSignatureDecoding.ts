import { useMemo } from "react";
import { decodeAbiParameters, type Hex, isHex } from "viem";
import type { SmartWalletSignatureData } from "../components/SmartWalletSignature";
import type { WebAuthnData } from "../components/WebAuthnDisplay";
import { decode6492Signature } from "../utils/decode6492";

type Decoded6492Signature = {
	create2Factory: string;
	factoryCalldata: string;
	originalERC1271Signature: string;
} | null;

type SignatureDecodingResult = {
	decodedSignature: Decoded6492Signature;
	decodedSmartWalletSignature: SmartWalletSignatureData | null;
	decodedWebAuthn: WebAuthnData | null;
};

export function useSignatureDecoding(
	signature: string,
): SignatureDecodingResult {
	const decodedSignature = useMemo(() => {
		if (!signature) return null;
		return decode6492Signature(signature);
	}, [signature]);

	// Decode the inner signature (either from 6492 or direct) as Coinbase Smart Wallet format
	const decodedSmartWalletSignature = useMemo(() => {
		const sigToDecode = decodedSignature?.originalERC1271Signature || signature;
		if (!sigToDecode || !isHex(sigToDecode)) return null;

		try {
			const [decoded] = decodeAbiParameters(
				[
					{
						type: "tuple",
						components: [
							{ name: "ownerIndex", type: "uint256" },
							{ name: "signatureData", type: "bytes" },
						],
					},
				],
				sigToDecode as Hex,
			);
			return {
				ownerIndex: decoded.ownerIndex,
				signatureData: decoded.signatureData,
			};
		} catch (_e) {
			return null;
		}
	}, [decodedSignature, signature]);

	// Try to decode signatureData as WebAuthn if it's a passkey signature
	const decodedWebAuthn = useMemo(() => {
		if (!decodedSmartWalletSignature?.signatureData) return null;

		try {
			const [decoded] = decodeAbiParameters(
				[
					{
						type: "tuple",
						components: [
							{ name: "authenticatorData", type: "bytes" },
							{ name: "clientDataJSON", type: "string" },
							{ name: "challengeIndex", type: "uint256" },
							{ name: "typeIndex", type: "uint256" },
							{ name: "r", type: "uint256" },
							{ name: "s", type: "uint256" },
						],
					},
				],
				decodedSmartWalletSignature.signatureData as Hex,
			);

			// Try to parse clientDataJSON
			let parsedClientData = null;
			try {
				parsedClientData = JSON.parse(decoded.clientDataJSON);
			} catch (_e) {
				// Not valid JSON, keep as string
			}

			return {
				authenticatorData: decoded.authenticatorData,
				clientDataJSON: decoded.clientDataJSON,
				parsedClientData,
				challengeIndex: decoded.challengeIndex,
				typeIndex: decoded.typeIndex,
				r: decoded.r,
				s: decoded.s,
			};
		} catch (_e) {
			return null;
		}
	}, [decodedSmartWalletSignature]);

	return {
		decodedSignature,
		decodedSmartWalletSignature,
		decodedWebAuthn,
	};
}
