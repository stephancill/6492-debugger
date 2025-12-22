import { getChain } from "../utils/chains";

type VerificationStatusProps = {
	isVerifying: boolean;
	verificationError: Error | null;
	verificationResult: boolean | null | undefined;
	chainId: number;
};

export function VerificationStatus({
	isVerifying,
	verificationError,
	verificationResult,
	chainId,
}: VerificationStatusProps) {
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
			</h3>
			{isVerifying ? (
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
		</div>
	);
}
