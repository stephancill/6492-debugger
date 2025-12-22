import { formatArg } from "../utils/formatArg";
import { ArgRenderer } from "./ArgRenderer";
import { ResultField } from "./Layout";
import {
	SmartWalletSignature,
	type SmartWalletSignatureData,
} from "./SmartWalletSignature";
import type { WebAuthnData } from "./WebAuthnDisplay";

type Decoded6492Signature = {
	create2Factory: string;
	factoryCalldata: string;
	originalERC1271Signature: string;
};

type DecodedFactoryData = {
	functionName: string;
	args?: readonly unknown[];
} | null;

type DecodedSignatureProps = {
	decodedSignature: Decoded6492Signature;
	decodedFactoryData: DecodedFactoryData;
	factoryDecodeError: Error | null;
	smartWalletSignature: SmartWalletSignatureData | null;
	webAuthn: WebAuthnData | null;
};

export function DecodedSignature({
	decodedSignature,
	decodedFactoryData,
	factoryDecodeError,
	smartWalletSignature,
	webAuthn,
}: DecodedSignatureProps) {
	return (
		<div className="section">
			<h3>Decoded ERC-6492 Signature</h3>

			<ResultField label="Create2 Factory">
				<code>{decodedSignature.create2Factory}</code>
			</ResultField>

			<ResultField label="Factory Calldata">
				<textarea readOnly value={decodedSignature.factoryCalldata} rows={3} />
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
						{decodedFactoryData.args?.map((arg: unknown, i: number) => (
							<span key={i}>
								{i > 0 && ", "}
								{typeof arg === "object" ? "..." : formatArg(arg)}
							</span>
						))}
						)
					</code>

					{/* Show detailed args if available */}
					{decodedFactoryData.args && decodedFactoryData.args.length > 0 && (
						<div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
							{decodedFactoryData.args.map((arg: unknown, i: number) => (
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
					Could not decode factory data: {factoryDecodeError.message}
				</div>
			)}

			<ResultField label="Original Signature">
				<textarea
					readOnly
					value={decodedSignature.originalERC1271Signature}
					rows={4}
				/>
			</ResultField>

			{smartWalletSignature && (
				<div style={{ marginLeft: "1rem", marginBottom: "1rem" }}>
					<SmartWalletSignature
						signature={smartWalletSignature}
						webAuthn={webAuthn}
					/>
				</div>
			)}
		</div>
	);
}
