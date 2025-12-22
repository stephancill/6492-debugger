import { useQueries } from "@tanstack/react-query";
import { type Address, createPublicClient, type Hex, http } from "viem";
import { mainnet } from "viem/chains";

type TypedData = {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
};

export type RpcResult = {
  name: string;
  url: string;
  result: boolean | null;
  error: Error | null;
  isPending: boolean;
};

export const MAINNET_RPCS = [
  { name: "PublicNode", url: "https://ethereum-rpc.publicnode.com" },
  { name: "0xrpc.io", url: "https://0xrpc.io/eth" },
  { name: "Tenderly", url: "https://mainnet.gateway.tenderly.co" },
  { name: "DRPC", url: "https://eth.drpc.org" },
  { name: "Pocket Network", url: "https://eth.api.pocket.network" },
  { name: "LlamaRPC", url: "https://eth.llamarpc.com" },
  { name: "Merkle", url: "https://eth.merkle.io" },
] as const;

type UseMultiRpcVerificationParams = {
  address: string;
  signature: string;
  message: string;
  isTypedData: boolean;
  typedData: TypedData | null;
  typedDataError: string | null;
  rawMessage: string | null;
  chainId: number;
};

export function useMultiRpcVerification({
  address,
  signature,
  message,
  isTypedData,
  typedData,
  typedDataError,
  rawMessage,
  chainId,
}: UseMultiRpcVerificationParams): {
  results: RpcResult[];
  isMainnet: boolean;
} {
  const isMainnet = chainId === 1;
  const enabled =
    isMainnet &&
    !!address &&
    !!signature &&
    !!message &&
    !typedDataError &&
    (isTypedData ? !!typedData : !!rawMessage);

  const queries = useQueries({
    queries: MAINNET_RPCS.map((rpc) => ({
      queryKey: [
        "multiRpcVerify",
        rpc.url,
        address,
        signature,
        message,
        isTypedData,
      ],
      queryFn: async () => {
        const client = createPublicClient({
          chain: mainnet,
          transport: http(rpc.url, { timeout: 15000 }),
        });

        if (isTypedData && typedData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (client as any).verifyTypedData({
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
      enabled,
      retry: false,
      staleTime: 30000,
    })),
  });

  const results: RpcResult[] = MAINNET_RPCS.map((rpc, index) => ({
    name: rpc.name,
    url: rpc.url,
    result: queries[index]?.data ?? null,
    error: queries[index]?.error as Error | null,
    isPending: queries[index]?.isPending ?? false,
  }));

  return { results, isMainnet };
}
