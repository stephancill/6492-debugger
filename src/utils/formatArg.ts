export function formatArg(arg: unknown): string {
	if (typeof arg === "bigint") {
		return arg.toString();
	}
	if (typeof arg === "object" && arg !== null) {
		if (Array.isArray(arg)) {
			return `[${arg.map(formatArg).join(", ")}]`;
		}
		return JSON.stringify(
			arg,
			(_, value) => (typeof value === "bigint" ? value.toString() : value),
			2,
		);
	}
	return String(arg);
}
