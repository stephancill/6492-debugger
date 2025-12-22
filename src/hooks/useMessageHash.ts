import { useMemo } from "react";
import { hashMessage, hashTypedData } from "viem";

type TypedData = {
	domain: Record<string, unknown>;
	types: Record<string, unknown>;
	primaryType: string;
	message: Record<string, unknown>;
};

type MessageHashResult = {
	messageHash: `0x${string}` | null;
	isTypedData: boolean;
	typedDataError: string | null;
	typedData: TypedData | null;
	rawMessage: string | null;
};

export function useMessageHash(message: string): MessageHashResult {
	return useMemo(() => {
		if (!message) {
			return {
				messageHash: null,
				isTypedData: false,
				typedDataError: null,
				typedData: null,
				rawMessage: null,
			};
		}

		// Try to parse as JSON for Typed Data
		try {
			const json = JSON.parse(message);
			// Simple heuristic for Typed Data
			if (json.domain && json.types && json.message) {
				let primaryType = json.primaryType as string | undefined;
				if (!primaryType) {
					const types = Object.keys(json.types).filter(
						(k) => k !== "EIP712Domain",
					);
					if (types.length === 1) primaryType = types[0];
				}

				if (!primaryType) {
					return {
						messageHash: null,
						isTypedData: true,
						typedDataError: "Missing 'primaryType' in JSON",
						typedData: null,
						rawMessage: null,
					};
				}

				const hash = hashTypedData({
					domain: json.domain,
					types: json.types,
					primaryType: primaryType,
					message: json.message,
				});
				return {
					messageHash: hash,
					isTypedData: true,
					typedDataError: null,
					typedData: { ...json, primaryType },
					rawMessage: null,
				};
			}
		} catch (_e) {
			// Not JSON, treat as raw string
		}

		// Treat as raw string message
		return {
			messageHash: hashMessage(message),
			isTypedData: false,
			typedDataError: null,
			typedData: null,
			rawMessage: message,
		};
	}, [message]);
}
