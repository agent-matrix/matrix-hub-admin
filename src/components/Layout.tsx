// src/components/Layout.tsx
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  AppBar, Toolbar, Container, Button, Stack, Box, Tooltip, IconButton, Typography
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ColorModeContext } from "../theme";

const LINKS: ReadonlyArray<[string, string]> = [
  ["/catalog",  "Catalog"],
  ["/remotes",  "Remotes"],
  ["/ingest",   "Ingest"],
  ["/gateway",  "Gateway"],
  ["/health",   "Health"],
  ["/settings", "Settings"],
  ["/search",   "Search"],
  ["/entities", "Entities"],
];

export default function Layout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  const router = useRouter();
  const { status } = useSession();
  const { mode, toggle } = React.useContext(ColorModeContext);

  const isActive = (href: string) => router.pathname === href;

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{ color: "inherit", textDecoration: "none" }}
          >
            Matrix Hub Admin
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {LINKS.map(([href, label]) => (
              <Button
                key={href}
                component={Link}
                href={href}
                color={isActive(href) ? "primary" : "inherit"}
                variant={isActive(href) ? "contained" : "text"}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Button>
            ))}
          </Stack>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
              <IconButton onClick={toggle} aria-label="Toggle color mode">
                {mode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {status === "authenticated" ? (
              <Button onClick={() => signOut({ callbackUrl: "/login" })} variant="outlined">
                Logout
              </Button>
            ) : (
              <Button onClick={() => signIn(undefined, { callbackUrl: "/" })} variant="contained">
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {breadcrumb && <Box sx={{ mb: 2 }}>{breadcrumb}</Box>}
        {children}
      </Container>
    </>
  );
}
