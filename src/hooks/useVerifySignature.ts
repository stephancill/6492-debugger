import { useQuery } from "@tanstack/react-query";
import type { Address, Hex } from "viem";

type TypedData = {
	domain: Record<string, unknown>;
	types: Record<string, unknown>;
	primaryType: string;
	message: Record<string, unknown>;
};

// Using a flexible client type to avoid viem version compatibility issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VerifyClient = any;

type UseVerifySignatureParams = {
	address: string;
	signature: string;
	message: string;
	isTypedData: boolean;
	typedData: TypedData | null;
	typedDataError: string | null;
	rawMessage: string | null;
	client: VerifyClient;
};

export function useVerifySignature({
	address,
	signature,
	message,
	isTypedData,
	typedData,
	typedDataError,
	rawMessage,
	client,
}: UseVerifySignatureParams) {
	return useQuery({
		queryKey: [
			"verifySignature",
			address,
			signature,
			message,
			client.chain?.id,
			isTypedData,
		],
		queryFn: async () => {
			if (!address || !signature || !message) return null;

			if (isTypedData && typedData) {
				return client.verifyTypedData({
					address: address as Address,
					domain: typedData.domain,
					types: typedData.types,
					primaryType: typedData.primaryType,
					message: typedData.message,
					signature: signature as Hex,
				});
			}
			if (rawMessage) {
				return client.verifyMessage({
					address: address as Address,
					message: rawMessage,
					signature: signature as Hex,
				});
			}
			return false;
		},
		enabled:
			!!address &&
			!!signature &&
			!!message &&
			!typedDataError &&
			(isTypedData ? !!typedData : !!rawMessage),
		retry: false,
	});
}
