"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from "react";

/**
 * Custom hook for Auth0 authentication
 * Provides easy access to auth state and methods
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function useAuth() {
  const [isClient, setIsClient] = useState(false);
  
  // Always call useAuth0 (hooks must be called unconditionally)
  const auth0 = useAuth0();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if Auth0 is configured (only on client)
  const isAuth0Configured =
    isClient &&
    process.env.NEXT_PUBLIC_AUTH0_DOMAIN &&
    process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  // If not on client yet, return loading state
  if (!isClient) {
    return {
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: async () => {},
      logout: () => {},
      getAccessToken: async () => null,
      getUserId: () => null,
      getUserEmail: () => null,
      getUserName: () => "User",
      getUserPicture: () => null,
    };
  }

  // If Auth0 is not configured, return error state
  if (!isAuth0Configured) {
    return {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: new Error("Auth0 is not configured. Please check your .env.local file."),
      login: async () => {
        console.error("Auth0 is not configured");
      },
      logout: () => {
        console.error("Auth0 is not configured");
      },
      getAccessToken: async () => null,
      getUserId: () => null,
      getUserEmail: () => null,
      getUserName: () => "User",
      getUserPicture: () => null,
    };
  }

  // Auth0 is configured, use real auth0 hook values
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    error,
  } = auth0;

  /**
   * Login with Auth0
   */
  const login = async () => {
    await loginWithRedirect();
  };

  /**
   * Logout from Auth0
   */
  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  /**
   * Get access token for API calls
   */
  const getAccessToken = async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  /**
   * Get user ID (Auth0 sub)
   */
  const getUserId = () => {
    return user?.sub || null;
  };

  /**
   * Get user email
   */
  const getUserEmail = () => {
    return user?.email || null;
  };

  /**
   * Get user name
   */
  const getUserName = () => {
    return user?.name || user?.email || "User";
  };

  /**
   * Get user picture
   */
  const getUserPicture = () => {
    return user?.picture || null;
  };

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    error,

    // Methods
    login,
    logout,
    getAccessToken,

    // User info helpers
    getUserId,
    getUserEmail,
    getUserName,
    getUserPicture,
  };
}
