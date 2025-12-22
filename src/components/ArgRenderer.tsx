import { formatArg } from "../utils/formatArg";

export function ArgRenderer({ value }: { value: unknown }) {
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
		const obj = value as Record<string, unknown>;
		if (obj.decodedCall) {
			const decodedCall = obj.decodedCall as {
				functionName: string;
				args?: unknown[];
			};
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
							{decodedCall.functionName}
						</span>
					</div>
					<div style={{ paddingLeft: "0.5rem", fontSize: "0.9em" }}>
						{decodedCall.args?.map((arg: unknown, i: number) => (
							<div key={i} style={{ display: "flex", gap: "0.5rem" }}>
								<span style={{ color: "#888" }}>{i}:</span>
								<ArgRenderer value={arg} />
							</div>
						))}
					</div>
					<div
						style={{ marginTop: "0.5rem", fontSize: "0.8em", color: "#666" }}
					>
						Target: {(obj.target as string) || (obj.to as string)}
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
