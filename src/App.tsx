import { useMemo } from "react";
import {
  hashMessage,
  hashTypedData,
  createPublicClient,
  http,
  type Hex,
  type Address,
  decodeFunctionData,
  type Abi,
  isHex,
} from "viem";
import {
  mainnet,
  sepolia,
  optimism,
  arbitrum,
  polygon,
  base,
  baseSepolia,
} from "viem/chains";
import { useQuery } from "@tanstack/react-query";
import { decode6492Signature } from "./utils/decode6492";
import { Section, ResultField } from "./components/Layout";
import { whatsabi } from "@shazow/whatsabi";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

// Helper to get chain object from ID
const chains = [mainnet, sepolia, optimism, arbitrum, polygon, base, baseSepolia];
const getChain = (chainId: number) => chains.find((c) => c.id === chainId);

function formatArg(arg: any): string {
  if (typeof arg === "object" && arg !== null) {
    if (Array.isArray(arg)) {
      return `[${arg.map(formatArg).join(", ")}]`;
    }
    // BigInt handling
    if (typeof arg === "bigint") {
      return arg.toString();
    }
    return JSON.stringify(
      arg,
      (_, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    );
  }
  return String(arg);
}

function ArgRenderer({ value }: { value: any }) {
  if (value === null) return <span style={{ color: "#888" }}>null</span>;

  if (Array.isArray(value)) {
    return (
      <div
        style={{
          paddingLeft: "1rem",
          borderLeft: "1px solid #444",
          marginTop: "0.25rem",
        }}
      >
        {value.map((item, i) => (
          <div key={i} style={{ marginBottom: "0.25rem" }}>
            <ArgRenderer value={item} />
            {i < value.length - 1 && <span style={{ color: "#666" }}>,</span>}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    if (value.decodedCall) {
      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "0.5rem",
            borderRadius: "4px",
            marginTop: "0.25rem",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <span style={{ color: "#aaa" }}>Action: </span>
            <span style={{ color: "#fff", fontWeight: "bold" }}>
              {value.decodedCall.functionName}
            </span>
          </div>
          <div style={{ paddingLeft: "0.5rem", fontSize: "0.9em" }}>
            {value.decodedCall.args?.map((arg: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ color: "#888" }}>{i}:</span>
                <ArgRenderer value={arg} />
              </div>
            ))}
          </div>
          <div
            style={{ marginTop: "0.5rem", fontSize: "0.8em", color: "#666" }}
          >
            Target: {value.target || value.to}
          </div>
        </div>
      );
    }

    // Fallback for other objects
    return (
      <span style={{ whiteSpace: "pre-wrap", color: "#aaccff" }}>
        {formatArg(value)}
      </span>
    );
  }

  return (
    <span style={{ color: "#aaccff", wordBreak: "break-all" }}>
      {formatArg(value)}
    </span>
  );
}

function App() {
  const [message, setMessage] = useQueryState(
    "message",
    parseAsString.withDefault("")
  );
  const [signature, setSignature] = useQueryState(
    "signature",
    parseAsString.withDefault("")
  );
  const [address, setAddress] = useQueryState(
    "address",
    parseAsString.withDefault("")
  );
  const [chainId, setChainId] = useQueryState(
    "chainId",
    parseAsInteger.withDefault(1)
  );

  const { messageHash, isTypedData, typedDataError, typedData, rawMessage } =
    useMemo(() => {
      if (!message)
        return {
          messageHash: null,
          isTypedData: false,
          typedDataError: null,
          typedData: null,
          rawMessage: null,
        };

      // Try to parse as JSON for Typed Data
      try {
        const json = JSON.parse(message);
        // Simple heuristic for Typed Data
        if (json.domain && json.types && json.message) {
          let primaryType = json.primaryType;
          if (!primaryType) {
            const types = Object.keys(json.types).filter(
              (k) => k !== "EIP712Domain"
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
      } catch (e) {
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

  const decodedSignature = useMemo(() => {
    if (!signature) return null;
    return decode6492Signature(signature);
  }, [signature]);

  const client = useMemo(() => {
    return createPublicClient({
      chain: getChain(chainId) || mainnet,
      transport: http(),
    });
  }, [chainId]);

  // Decode Factory Calldata using whatsabi
  const { data: decodedFactoryData, error: factoryDecodeError } = useQuery({
    queryKey: [
      "decodeFactory",
      decodedSignature?.create2Factory,
      decodedSignature?.factoryCalldata,
      chainId,
    ],
    queryFn: async () => {
      if (
        !decodedSignature?.create2Factory ||
        !decodedSignature?.factoryCalldata
      )
        return null;

      try {
        const result = await whatsabi.autoload(
          decodedSignature.create2Factory,
          { provider: client }
        );

        if (!result.abi) return null;

        const decoded = decodeFunctionData({
          abi: result.abi as Abi,
          data: decodedSignature.factoryCalldata as Hex,
        });

        const enrichArgs = async (args: any[]): Promise<any[]> => {
          return Promise.all(
            args.map(async (arg) => {
              if (Array.isArray(arg)) {
                return enrichArgs(arg);
              }
              if (arg && typeof arg === "object") {
                const target = arg.target || arg.to;
                const data = arg.callData || arg.data;

                if (target && data && isHex(data) && data !== "0x") {
                  try {
                    const r = await whatsabi.autoload(target, {
                      provider: client,
                    });
                    if (r.abi) {
                      const decodedInner = decodeFunctionData({
                        abi: r.abi as Abi,
                        data,
                      });
                      return { ...arg, decodedCall: decodedInner };
                    }
                  } catch (e) {
                    console.log("Inner decode failed", e);
                  }
                }
              }
              return arg;
            })
          );
        };

        if (decoded.args) {
          const args = await enrichArgs(decoded.args as any[]);
          return { ...decoded, args };
        }

        return decoded;
      } catch (e) {
        console.error("WhatsABI decode error:", e);
        throw e;
      }
    },
    enabled:
      !!decodedSignature?.create2Factory && !!decodedSignature?.factoryCalldata,
    retry: false,
  });

  // Verification Query
  const {
    data: verificationResult,
    isPending: isVerifying,
    error: verificationError,
  } = useQuery({
    queryKey: [
      "verifySignature",
      address,
      signature,
      message,
      chainId,
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
      } else if (rawMessage) {
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

  return (
    <div className="container">
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "1px solid #333",
          paddingBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>ERC-6492 Signature Debugger</h1>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
            <a
              href="https://eip.tools/eip/6492"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              ERC-6492
            </a>
            <a
              href="https://github.com/stephancill/6492-debugger"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main>
        <div className="grid">
          <Section label="Chain ID">
            <select
              id="chain-input"
              value={chainId}
              onChange={(e) => setChainId(Number(e.target.value))}
            >
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} ({chain.id})
                </option>
              ))}
            </select>
          </Section>

          <Section label="Signer Address">
            <input
              id="address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
            />
          </Section>
        </div>

        <Section
          label="Message / Typed Data (JSON)"
          badge={
            isTypedData && <span className="badge">Typed Data Detected</span>
          }
        >
          <textarea
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter text message or JSON Typed Data..."
            rows={8}
            style={{ resize: "vertical" }}
          />
          {typedDataError && (
            <div style={{ color: "#e74c3c", marginTop: "0.5rem" }}>
              {typedDataError}
            </div>
          )}
          {messageHash && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              <span style={{ color: "#888", marginRight: "0.5rem" }}>
                Message Hash:
              </span>
              <code style={{ color: "#f1c40f" }}>{messageHash}</code>
            </div>
          )}
        </Section>

        <Section label="Signature">
          <textarea
            id="signature-input"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="0x..."
            rows={4}
          />
        </Section>

        {/* Verification Result */}
        {address && signature && message && (
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#1e1e1e",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              Verification Status
            </h3>
            {isVerifying ? (
              <p>Verifying signature on-chain...</p>
            ) : verificationError ? (
              <p style={{ color: "#e74c3c" }}>
                Error: {(verificationError as Error).message}
              </p>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    background: verificationResult
                      ? "rgba(46, 204, 113, 0.2)"
                      : "rgba(231, 76, 60, 0.2)",
                    color: verificationResult ? "#2ecc71" : "#e74c3c",
                    border: `1px solid ${verificationResult ? "#2ecc71" : "#e74c3c"}`,
                  }}
                >
                  {verificationResult ? "VALID" : "INVALID"}
                </span>
                <span style={{ color: "#888" }}>
                  Verified on {getChain(chainId)?.name}
                </span>
              </div>
            )}
          </div>
        )}

        {decodedSignature ? (
          <div className="section">
            <h3>Decoded ERC-6492 Signature</h3>

            <ResultField label="Create2 Factory">
              <code>{decodedSignature.create2Factory}</code>
            </ResultField>

            <ResultField label="Factory Calldata">
              <textarea
                readOnly
                value={decodedSignature.factoryCalldata}
                rows={3}
              />
            </ResultField>

            {decodedFactoryData && (
              <div
                style={{
                  marginLeft: "1rem",
                  marginBottom: "1rem",
                  padding: "1rem",
                  borderLeft: "2px solid #444",
                  background: "#1a1a1a",
                }}
              >
                <div style={{ color: "#aaa", marginBottom: "0.5rem" }}>
                  Decoded Call:
                </div>
                <code
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "#fff",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {decodedFactoryData.functionName}(
                  {decodedFactoryData.args?.map((arg, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      {/* We use ArgRenderer here but in a inline way? 
                          ArgRenderer returns a DIV usually for objects. 
                          Let's keep the summary simplified or just show "..."?
                          Actually the user wants to see args. 
                      */}
                      {typeof arg === "object" ? "..." : formatArg(arg)}
                    </span>
                  ))}
                  )
                </code>

                {/* Show detailed args if available */}
                {decodedFactoryData.args &&
                  decodedFactoryData.args.length > 0 && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                      {decodedFactoryData.args.map((arg, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "0.25rem",
                            flexDirection: "column",
                          }}
                        >
                          <span style={{ color: "#888" }}>arg[{i}]:</span>
                          <ArgRenderer value={arg} />
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
            {factoryDecodeError && (
              <div
                style={{
                  color: "#e74c3c",
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                }}
              >
                Could not decode factory data:{" "}
                {(factoryDecodeError as Error).message}
              </div>
            )}

            <ResultField label="Original Signature">
              <textarea
                readOnly
                value={decodedSignature.originalERC1271Signature}
                rows={4}
              />
            </ResultField>
          </div>
        ) : (
          signature && (
            <div className="section">
              <h3>Signature Status</h3>
              <p>Not an ERC-6492 signature (Magic Bytes not found).</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
