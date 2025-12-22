export function Header() {
	return (
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
	);
}
