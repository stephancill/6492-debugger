import type { Hex } from "viem";

export type WebAuthnData = {
	authenticatorData: Hex;
	clientDataJSON: string;
	parsedClientData: unknown;
	challengeIndex: bigint;
	typeIndex: bigint;
	r: bigint;
	s: bigint;
};

export function WebAuthnDisplay({ data }: { data: WebAuthnData }) {
	return (
		<div
			style={{
				marginTop: "0.5rem",
				marginLeft: "1rem",
				paddingLeft: "0.75rem",
				borderLeft: "2px solid #444",
			}}
		>
			<div style={{ color: "#888", marginBottom: "0.5rem" }}>
				Decoded WebAuthn:
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<div>
					<span style={{ color: "#888" }}>authenticatorData: </span>
					<code
						style={{
							color: "#aaccff",
							wordBreak: "break-all",
							display: "block",
							marginTop: "0.25rem",
						}}
					>
						{data.authenticatorData}
					</code>
				</div>
				<div>
					<span style={{ color: "#888" }}>clientDataJSON: </span>
					<code
						style={{
							color: "#aaccff",
							wordBreak: "break-all",
							display: "block",
							marginTop: "0.25rem",
						}}
					>
						{data.parsedClientData
							? JSON.stringify(data.parsedClientData, null, 2)
							: data.clientDataJSON}
					</code>
				</div>
				<div>
					<span style={{ color: "#888" }}>challengeIndex: </span>
					<code style={{ color: "#aaccff" }}>
						{data.challengeIndex.toString()}
					</code>
				</div>
				<div>
					<span style={{ color: "#888" }}>typeIndex: </span>
					<code style={{ color: "#aaccff" }}>{data.typeIndex.toString()}</code>
				</div>
				<div>
					<span style={{ color: "#888" }}>r: </span>
					<code
						style={{
							color: "#aaccff",
							wordBreak: "break-all",
							display: "block",
							marginTop: "0.25rem",
						}}
					>
						0x{data.r.toString(16)}
					</code>
				</div>
				<div>
					<span style={{ color: "#888" }}>s: </span>
					<code
						style={{
							color: "#aaccff",
							wordBreak: "break-all",
							display: "block",
							marginTop: "0.25rem",
						}}
					>
						0x{data.s.toString(16)}
					</code>
				</div>
			</div>
		</div>
	);
}
