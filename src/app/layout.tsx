import Nav from "../components/Nav";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  RefineSnackbarProvider,
  useNotificationProvider,
} from "@refinedev/mui";
import routerProvider from "@refinedev/nextjs-router";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";

import { ColorModeContextProvider } from "@contexts/color-mode";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import { dataProvider } from "@providers/data-provider";

export const metadata: Metadata = {
  title: "Matrix Hub Admin",
  description: "Admin UI for Matrix Hub & MCP Gateway",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get("theme");
  const defaultMode = theme?.value === "dark" ? "dark" : "light";

  return (
    <html lang="en">
      <body>
        <Nav />
        <Suspense>
          <RefineKbarProvider>
            <ColorModeContextProvider defaultMode={defaultMode}>
              <RefineSnackbarProvider>
                <Refine
                  routerProvider={routerProvider}
                  dataProvider={dataProvider}
                  notificationProvider={useNotificationProvider}
                  authProvider={authProviderClient}
                  resources={[
                    { name: "remotes", list: "/remotes", meta: { label: "Remotes" } },
                    { name: "ingest", list: "/ingest", meta: { label: "Ingest" } },
                    { name: "catalog", list: "/catalog", meta: { label: "Catalog" } },
                    { name: "gateway", list: "/gateway", meta: { label: "Gateway" } },
                    { name: "health", list: "/health", meta: { label: "Health" } },
                    { name: "settings", list: "/settings", meta: { label: "Settings" } },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    useNewQueryKeys: true,
                    projectId: "matrix-hub-admin",
                  }}
                >
                  {children}
                  <RefineKbar />
                </Refine>
              </RefineSnackbarProvider>
            </ColorModeContextProvider>
          </RefineKbarProvider>
        </Suspense>
      </body>
    </html>
  );
}
