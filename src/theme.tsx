// src/theme.tsx
import * as React from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

type Mode = "light" | "dark";
export const ColorModeContext = React.createContext<{mode: Mode; toggle: () => void}>({
  mode: "light",
  toggle: () => {},
});

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<Mode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme") as Mode | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  React.useEffect(() => { try { localStorage.setItem("theme", mode); } catch {} }, [mode]);

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: "#2563eb" },
      success: { main: "#16a34a" },
      warning: { main: "#f59e0b" },
      error:   { main: "#dc2626" },
    },
    shape: { borderRadius: 10 },
    typography: { fontSize: 14 },
  }), [mode]);

  const toggle = () => setMode(m => (m === "light" ? "dark" : "light"));

  return (
    <ColorModeContext.Provider value={{mode, toggle}}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
