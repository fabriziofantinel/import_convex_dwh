"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Requirements: 1.1, 10.1
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // If there's an error (Auth0 not configured), don't redirect
    if (error) {
      return;
    }

    // If not loading and not authenticated, prepare to redirect
    if (!isLoading && !isAuthenticated && isMounted) {
      setShouldRedirect(true);
    }
  }, [isAuthenticated, isLoading, error, isMounted]);

  useEffect(() => {
    if (shouldRedirect && isMounted) {
      router.push("/login");
    }
  }, [shouldRedirect, router, isMounted]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // If Auth0 is not configured, show configuration error
  if (error && error.message.includes("not configured")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <svg
              className="w-12 h-12 text-yellow-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Auth0 Configuration Required
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Auth0 is not configured. Please add your Auth0 credentials to{" "}
              <code className="bg-gray-100 px-1 rounded">.env.local</code>
            </p>
            <div className="text-left bg-white rounded p-4 text-xs font-mono mb-4">
              <p className="text-gray-500 mb-2">Required in .env.local:</p>
              <p className="text-gray-700">NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com</p>
              <p className="text-gray-700">NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id</p>
              <p className="text-gray-700">NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience</p>
            </div>
            <a
              href="/AUTH0_SETUP_GUIDE.md"
              target="_blank"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              View Setup Guide
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
