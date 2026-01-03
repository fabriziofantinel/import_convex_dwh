"use client";

import { ComponentType } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Higher Order Component to protect pages
 * Usage: export default withAuth(MyPage);
 * Requirements: 1.1, 10.1
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
