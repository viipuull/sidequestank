import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "sq-theme";

type ThemeCtx = { theme: ThemeMode; setTheme: (t: ThemeMode) => void; toggle: () => void };

const Ctx = createContext<ThemeCtx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

/** Inline pre-hydration script — applies the stored theme before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t="dark"}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t;}catch(e){}})();`;

function apply(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const next: ThemeMode = stored === "light" ? "light" : "dark";
    setThemeState(next);
    apply(next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — theme stays for this session only */
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark"),
    [setTheme],
  );

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}