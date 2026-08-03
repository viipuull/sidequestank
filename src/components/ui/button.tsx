import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:scale-[0.96] hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-[0_10px_30px_-10px_oklch(0.62_0.22_295/0.7)]",
        premium:
          "text-primary-foreground shadow-[0_12px_36px_-14px_oklch(0.62_0.22_295/0.8)] bg-[linear-gradient(120deg,var(--primary),oklch(0.7_0.2_330))] hover:brightness-110",
        glass:
          "glass-panel text-foreground hover:border-primary/40 hover:shadow-[0_18px_44px_-20px_oklch(0.62_0.22_295/0.7)]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
