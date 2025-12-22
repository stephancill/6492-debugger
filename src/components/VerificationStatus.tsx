import { useState } from "react";
import type { RpcResult } from "../hooks/useMultiRpcVerification";
import type { VerificationCallData } from "../hooks/useVerificationCallData";
import { getChain } from "../utils/chains";
import { ResultField } from "./Layout";

type VerificationStatusProps = {
	isVerifying: boolean;
	verificationError: Error | null;
	verificationResult: boolean | null | undefined;
	chainId: number;
	verificationCallData: VerificationCallData | null;
	multiRpcResults?: RpcResult[];
	isMainnet?: boolean;
};

function RpcResultBadge({ result }: { result: RpcResult }) {
	if (result.isPending) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0.5rem 0.75rem",
					background: "rgba(255, 255, 255, 0.05)",
					borderRadius: "4px",
					border: "1px solid #555",
				}}
			>
				<span style={{ color: "#ddd" }}>{result.name}</span>
				<span style={{ color: "#888", fontSize: "0.85rem" }}>⏳</span>
			</div>
		);
	}

	if (result.error) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0.5rem 0.75rem",
					background: "rgba(241, 196, 15, 0.1)",
					borderRadius: "4px",
					border: "1px solid #f1c40f",
				}}
				title={result.error.message}
			>
				<span style={{ color: "#ddd" }}>{result.name}</span>
				<span
					style={{
						color: "#f1c40f",
						fontSize: "0.85rem",
						fontWeight: "bold",
					}}
				>
					⚠️ ERROR
				</span>
			</div>
		);
	}

	const isValid = result.result === true;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0.5rem 0.75rem",
				background: isValid
					? "rgba(46, 204, 113, 0.1)"
					: "rgba(231, 76, 60, 0.1)",
				borderRadius: "4px",
				border: `1px solid ${isValid ? "#2ecc71" : "#e74c3c"}`,
			}}
		>
			<span style={{ color: "#ddd" }}>{result.name}</span>
			<span
				style={{
					color: isValid ? "#2ecc71" : "#e74c3c",
					fontSize: "0.85rem",
					fontWeight: "bold",
				}}
			>
				{isValid ? "✓ VALID" : "✗ INVALID"}
			</span>
		</div>
	);
}

export function VerificationStatus({
	isVerifying,
	verificationError,
	verificationResult,
	chainId,
	verificationCallData,
	multiRpcResults,
	isMainnet,
}: VerificationStatusProps) {
	const [calldataExpanded, setCalldataExpanded] = useState(false);

	const isMulticall = verificationCallData?.type === "multicall";
	const calldataTitle = isMulticall
		? "Multicall3 Verification Calldata"
		: "isValidSignature Calldata";
	const calldataDescription = isMulticall
		? "Deploy + isValidSignature in a single call via Multicall3"
		: "Direct ERC-1271 isValidSignature call to the signer contract";
	const toLabel = isMulticall ? "To (Multicall3)" : "To (Signer)";

	// Calculate overall status for mainnet multi-RPC
	const showMultiRpc =
		isMainnet && multiRpcResults && multiRpcResults.length > 0;
	const completedResults = multiRpcResults?.filter((r) => !r.isPending) ?? [];
	const successfulResults = completedResults.filter((r) => !r.error);
	const validCount = successfulResults.filter((r) => r.result === true).length;
	const invalidCount = successfulResults.filter(
		(r) => r.result === false,
	).length;
	const errorCount = completedResults.filter((r) => r.error).length;
	const pendingCount = multiRpcResults?.filter((r) => r.isPending).length ?? 0;

	return (
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
				{showMultiRpc && (
					<span
						style={{
							marginLeft: "0.75rem",
							fontSize: "0.8rem",
							color: "#888",
							fontWeight: "normal",
						}}
					>
						(Multi-RPC on Mainnet)
					</span>
				)}
			</h3>

			{showMultiRpc ? (
				<>
					{/* Summary */}
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "0.75rem",
							marginBottom: "1rem",
							padding: "0.75rem",
							background: "rgba(255, 255, 255, 0.03)",
							borderRadius: "6px",
						}}
					>
						{pendingCount > 0 && (
							<span style={{ color: "#888" }}>⏳ {pendingCount} pending</span>
						)}
						{validCount > 0 && (
							<span style={{ color: "#2ecc71" }}>✓ {validCount} valid</span>
						)}
						{invalidCount > 0 && (
							<span style={{ color: "#e74c3c" }}>✗ {invalidCount} invalid</span>
						)}
						{errorCount > 0 && (
							<span style={{ color: "#f1c40f" }}>⚠️ {errorCount} errors</span>
						)}
					</div>

					{/* Individual RPC Results */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
							gap: "0.5rem",
						}}
					>
						{multiRpcResults.map((result) => (
							<RpcResultBadge key={result.url} result={result} />
						))}
					</div>
				</>
			) : isVerifying ? (
				<p>Verifying signature on-chain...</p>
			) : verificationError ? (
				<p style={{ color: "#e74c3c" }}>Error: {verificationError.message}</p>
			) : (
				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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

			{verificationCallData && (
				<div
					style={{
						marginTop: "1.5rem",
						border: "1px solid #3498db",
						borderRadius: "8px",
						overflow: "hidden",
					}}
				>
					<button
						type="button"
						onClick={() => setCalldataExpanded(!calldataExpanded)}
						style={{
							width: "100%",
							padding: "0.75rem 1rem",
							background: "rgba(52, 152, 219, 0.1)",
							border: "none",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							color: "#3498db",
							fontSize: "1rem",
							fontWeight: 600,
							textAlign: "left",
						}}
					>
						<span
							style={{
								display: "inline-block",
								transition: "transform 0.2s ease",
								transform: calldataExpanded ? "rotate(90deg)" : "rotate(0deg)",
							}}
						>
							▶
						</span>
						{calldataTitle}
					</button>
					{calldataExpanded && (
						<div
							style={{
								padding: "1rem",
								background: "rgba(52, 152, 219, 0.05)",
							}}
						>
							<p
								style={{
									fontSize: "0.85rem",
									color: "#888",
									margin: "0 0 0.75rem 0",
								}}
							>
								{calldataDescription}
							</p>
							<ResultField label={toLabel}>
								<code>{verificationCallData.to}</code>
							</ResultField>
							<ResultField label="Calldata">
								<textarea
									readOnly
									value={verificationCallData.data}
									rows={4}
									onClick={(e) => (e.target as HTMLTextAreaElement).select()}
									style={{ cursor: "pointer" }}
								/>
							</ResultField>
							<div style={{ marginTop: "1rem" }}>
								<a
									href={verificationCallData.tenderlyUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="link"
									style={{
										display: "inline-flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.5rem 1rem",
										background: "rgba(52, 152, 219, 0.2)",
										borderRadius: "4px",
										textDecoration: "none",
									}}
								>
									Simulate on Tenderly ↗
								</a>
							</div>
							<p
								style={{
									fontSize: "0.8rem",
									color: "#888",
									margin: "0.75rem 0 0 0",
									fontFamily: "monospace",
								}}
							>
								Valid if:{" "}
								<code style={{ color: "#f1c40f" }}>result == 0x1626ba7e</code>
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
