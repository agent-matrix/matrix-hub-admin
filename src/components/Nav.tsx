// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";

export default function Nav() {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/catalog">Catalog</Button>
          <Button component={Link} href="/remotes">Remotes</Button>
          <Button component={Link} href="/ingest">Ingest</Button>
          <Button component={Link} href="/gateway">Gateway</Button>
          <Button component={Link} href="/health">Health</Button>
          <Button component={Link} href="/settings">Settings</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
