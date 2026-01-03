"use client";

// Auth0 configuration
export const auth0Config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "",
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "",
  authorizationParams: {
    redirect_uri: process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || "",
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || "",
  },
};
