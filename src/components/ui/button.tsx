import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[-0.01em] cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:scale-[0.96] hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_12px_30px_-12px_color-mix(in_oklab,var(--primary)_70%,transparent)]",
        premium:
          "text-primary-foreground shadow-[0_14px_36px_-14px_color-mix(in_oklab,var(--primary)_75%,transparent)] bg-[var(--gradient-hero)] hover:brightness-110",
        glass:
          "glass-panel text-foreground hover:border-primary/40",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-card/50 backdrop-blur-xl shadow-sm hover:border-primary/40 hover:bg-card/80",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-foreground/[0.06] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-full px-3.5 text-xs",
        lg: "h-11 rounded-full px-8",
        xl: "h-12 rounded-full px-9 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const haptic = useHaptic();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      haptic.tick();
      onClick?.(e);
    };
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
