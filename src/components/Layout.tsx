import type { ReactNode } from "react";

export function Section({
	label,
	children,
	badge,
	className = "",
}: {
	label: string;
	children: ReactNode;
	badge?: ReactNode;
	className?: string;
}) {
	return (
		<div className={`section ${className}`}>
			<label>
				{label}
				{badge}
			</label>
			{children}
		</div>
	);
}

export function ResultField({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="field">
			<span className="label">{label}</span>
			{children}
		</div>
	);
}
