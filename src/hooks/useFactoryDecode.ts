import { whatsabi } from "@shazow/whatsabi";
import { useQuery } from "@tanstack/react-query";
import { type Abi, decodeFunctionData, type Hex, isHex } from "viem";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Provider = any;

async function enrichArgs(
	args: unknown[],
	client: Provider,
): Promise<unknown[]> {
	return Promise.all(
		args.map(async (arg) => {
			if (Array.isArray(arg)) {
				return enrichArgs(arg, client);
			}
			if (arg && typeof arg === "object") {
				const obj = arg as Record<string, unknown>;
				const target = obj.target || obj.to;
				const data = obj.callData || obj.data;

				if (
					target &&
					typeof target === "string" &&
					data &&
					typeof data === "string" &&
					isHex(data) &&
					data !== "0x"
				) {
					try {
						const r = await whatsabi.autoload(target, {
							provider: client,
						});
						if (r.abi) {
							const decodedInner = decodeFunctionData({
								abi: r.abi as Abi,
								data,
							});
							return { ...obj, decodedCall: decodedInner };
						}
					} catch (e) {
						console.log("Inner decode failed", e);
					}
				}
			}
			return arg;
		}),
	);
}

export function useFactoryDecode(
	create2Factory: string | undefined,
	factoryCalldata: string | undefined,
	client: Provider,
) {
	return useQuery({
		queryKey: ["decodeFactory", create2Factory, factoryCalldata],
		queryFn: async () => {
			if (!create2Factory || !factoryCalldata) return null;

			try {
				const result = await whatsabi.autoload(create2Factory, {
					provider: client,
				});

				if (!result.abi) return null;

				const decoded = decodeFunctionData({
					abi: result.abi as Abi,
					data: factoryCalldata as Hex,
				});

				if (decoded.args) {
					const args = await enrichArgs(decoded.args as unknown[], client);
					return { ...decoded, args };
				}

				return decoded;
			} catch (e) {
				console.error("WhatsABI decode error:", e);
				throw e;
			}
		},
		enabled: !!create2Factory && !!factoryCalldata,
		retry: false,
	});
}
