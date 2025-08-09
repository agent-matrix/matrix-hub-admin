import type { AppProps } from "next/app";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { ColorModeProvider } from "../theme";

function Guard({ children }: { children: JSX.Element }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") return null;
  return children;
}

export default function App({ Component, pageProps }: AppProps & { Component: any }) {
  const requireAuth = Component.requireAuth ?? true; // default: protected
  return (
    <SessionProvider session={(pageProps as any)?.session}>
      <ColorModeProvider>
        {requireAuth ? <Guard><Component {...pageProps} /></Guard> : <Component {...pageProps} />}
      </ColorModeProvider>
    </SessionProvider>
  );
}
