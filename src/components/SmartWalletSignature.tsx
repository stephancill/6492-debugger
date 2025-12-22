import type { WebAuthnData } from "./WebAuthnDisplay";
import { WebAuthnDisplay } from "./WebAuthnDisplay";

export type SmartWalletSignatureData = {
	ownerIndex: bigint;
	signatureData: string;
};

type SmartWalletSignatureProps = {
	signature: SmartWalletSignatureData;
	webAuthn: WebAuthnData | null;
};

export function SmartWalletSignature({
	signature,
	webAuthn,
}: SmartWalletSignatureProps) {
	return (
		<div
			style={{
				padding: "1rem",
				borderLeft: "2px solid #444",
				background: "#1a1a1a",
			}}
		>
			<div style={{ color: "#aaa", marginBottom: "0.5rem" }}>
				Coinbase Smart Wallet Signature:
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.5rem",
				}}
			>
				<div>
					<span style={{ color: "#888" }}>ownerIndex: </span>
					<code style={{ color: "#2ecc71" }}>
						{signature.ownerIndex.toString()}
					</code>
				</div>
				<div>
					<span style={{ color: "#888" }}>signatureData: </span>
					<code
						style={{
							color: "#aaccff",
							wordBreak: "break-all",
							display: "block",
							marginTop: "0.25rem",
						}}
					>
						{signature.signatureData}
					</code>
				</div>
				{webAuthn && <WebAuthnDisplay data={webAuthn} />}
			</div>
		</div>
	);
}
