"use client";

import { ConvexReactClient } from "convex/react";

// Initialize Convex client
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || ""
);
