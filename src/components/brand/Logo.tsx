interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ size = 160, className, priority = false }: LogoProps) {
  return (
    <img
      src="/sidequest-logo.png"
      alt="SideQuest - Your City. Your Adventure."
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
