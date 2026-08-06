import Link from "next/link";

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "dark" | "text" };

const variants = {
  primary: "bg-wood-500 text-white hover:bg-wood-600",
  secondary: "border border-forest-900/20 bg-white text-forest-950 hover:border-forest-900",
  dark: "bg-forest-900 text-white hover:bg-forest-800",
  text: "text-wood-600 hover:text-wood-700"
};

export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return <Link {...props} className={`pressable inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-extrabold ${variants[variant]} ${className}`} />;
}
