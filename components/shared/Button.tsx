import type { LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-blue-200 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none",
  secondary:
    "border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400",
  icon: "h-11 w-11 border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  className,
  icon: Icon,
  variant = "primary",
  ...props
}, ref) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      ref={ref}
      type="button"
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});
