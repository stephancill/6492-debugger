import { type Hex, slice, isHex, decodeAbiParameters } from "viem";

export const MAGIC_BYTES =
  "0x6492649264926492649264926492649264926492649264926492649264926492";

export type Decoded6492 = {
  create2Factory: string;
  factoryCalldata: string;
  originalERC1271Signature: string;
  isCounterfactual: boolean;
};

export function decode6492Signature(signature: string): Decoded6492 | null {
  if (!isHex(signature)) return null;

  // Check if it ends with magic bytes
  if (!signature.endsWith(MAGIC_BYTES.slice(2))) {
    return null;
  }

  // Remove magic bytes (32 bytes = 64 hex characters)
  const encodedData = slice(signature as Hex, 0, -32);

  try {
    const [create2Factory, factoryCalldata, originalERC1271Signature] =
      decodeAbiParameters(
        [{ type: "address" }, { type: "bytes" }, { type: "bytes" }],
        encodedData
      );

    return {
      create2Factory,
      factoryCalldata,
      originalERC1271Signature,
      isCounterfactual: true,
    };
  } catch (e) {
    console.error("Failed to decode 6492 signature", e);
    return null;
  }
}
