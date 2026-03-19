import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
	variant?: ButtonVariant;
	block?: boolean;
	loading?: boolean;
	children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const buttonStyles: Record<ButtonVariant, string> = {
	primary:
		"bg-(--brand) text-white hover:bg-(--brand-dark) shadow-[0_10px_24px_rgba(11,116,222,0.33)]",
	secondary:
		"bg-(--bg-soft) text-(--text-primary) hover:bg-[#dde9f6] border border-(--border)",
	ghost: "bg-transparent text-(--text-secondary) hover:bg-white/70 border border-transparent",
};

export const Button = ({
	variant = "primary",
	block = false,
	loading = false,
	children,
	className = "",
	disabled,
	...props
}: ButtonProps) => {
	const isDisabled = disabled || loading;

	return (
		<button
			type="button"
			className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${buttonStyles[variant]} ${block ? "w-full" : ""} ${isDisabled ? "cursor-not-allowed opacity-65" : ""} ${className}`}
			disabled={isDisabled}
			{...props}
		>
			{loading ? "Please wait..." : children}
		</button>
	);
};
