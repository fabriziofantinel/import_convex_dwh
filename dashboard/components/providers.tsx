"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { auth0Config } from "@/lib/auth0";
import { ToastProvider } from "@/components/providers/ToastProvider";

// Only initialize Convex client if URL is provided
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // If Auth0 is not configured, render children without Auth0Provider
  const isAuth0Configured = auth0Config.domain && auth0Config.clientId;

  const content = convex ? (
    <ConvexProvider client={convex}>
      <ToastProvider>{children}</ToastProvider>
    </ConvexProvider>
  ) : (
    <ToastProvider>{children}</ToastProvider>
  );

  if (!isAuth0Configured) {
    return content;
  }

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={auth0Config.authorizationParams}
    >
      {content}
    </Auth0Provider>
  );
}
