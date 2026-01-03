"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Auth0Provider } from "@auth0/auth0-react";
import { ToastProvider } from "./ToastProvider";

/**
 * Root Providers Component
 * Wraps the app with all necessary providers
 * Requirements: 1.1, 9.5
 */

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI!,
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
      }}
    >
      <ConvexProvider client={convex}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ConvexProvider>
    </Auth0Provider>
  );
}