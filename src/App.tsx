import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { DecodedSignature } from "./components/DecodedSignature";
import { Header } from "./components/Header";
import { Section } from "./components/Layout";
import { SmartWalletSignature } from "./components/SmartWalletSignature";
import { VerificationStatus } from "./components/VerificationStatus";
import { useFactoryDecode } from "./hooks/useFactoryDecode";

import { useMessageHash } from "./hooks/useMessageHash";
import { useSignatureDecoding } from "./hooks/useSignatureDecoding";
import { useVerifySignature } from "./hooks/useVerifySignature";
import { chains, getChain } from "./utils/chains";

function App() {
	const [message, setMessage] = useQueryState(
		"message",
		parseAsString.withDefault(""),
	);
	const [signature, setSignature] = useQueryState(
		"signature",
		parseAsString.withDefault(""),
	);
	const [address, setAddress] = useQueryState(
		"address",
		parseAsString.withDefault(""),
	);
	const [chainId, setChainId] = useQueryState(
		"chainId",
		parseAsInteger.withDefault(1),
	);

	const { messageHash, isTypedData, typedDataError, typedData, rawMessage } =
		useMessageHash(message);

	const { decodedSignature, decodedSmartWalletSignature, decodedWebAuthn } =
		useSignatureDecoding(signature);

	const client = useMemo(() => {
		return createPublicClient({
			chain: getChain(chainId) || mainnet,
			transport: http(),
		});
	}, [chainId]);

	const { data: decodedFactoryData, error: factoryDecodeError } =
		useFactoryDecode(
			decodedSignature?.create2Factory,
			decodedSignature?.factoryCalldata,
			client,
		);

	const {
		data: verificationResult,
		isPending: isVerifying,
		error: verificationError,
	} = useVerifySignature({
		address,
		signature,
		message,
		isTypedData,
		typedData,
		typedDataError,
		rawMessage,
		client,
	});

	return (
		<div className="container">
			<Header />

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
					<VerificationStatus
						isVerifying={isVerifying}
						verificationError={verificationError as Error | null}
						verificationResult={verificationResult}
						chainId={chainId}
					/>
				)}

				{decodedSignature ? (
					<DecodedSignature
						decodedSignature={decodedSignature}
						decodedFactoryData={decodedFactoryData ?? null}
						factoryDecodeError={factoryDecodeError as Error | null}
						smartWalletSignature={decodedSmartWalletSignature}
						webAuthn={decodedWebAuthn}
					/>
				) : (
					signature && (
						<div className="section">
							<h3>Signature Analysis</h3>
							<p style={{ color: "#888", marginBottom: "1rem" }}>
								Not an ERC-6492 signature (Magic Bytes not found).
							</p>

							{decodedSmartWalletSignature && (
								<SmartWalletSignature
									signature={decodedSmartWalletSignature}
									webAuthn={decodedWebAuthn}
								/>
							)}
						</div>
					)
				)}
			</main>
		</div>
	);
}

export default App;
