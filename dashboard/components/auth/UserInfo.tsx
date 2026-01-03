"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

/**
 * User Info Component
 * Displays user information when authenticated
 * Requirements: 1.3
 */
export function UserInfo() {
  const { isAuthenticated, getUserName, getUserEmail, getUserPicture } =
    useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const name = getUserName();
  const email = getUserEmail();
  const picture = getUserPicture();

  return (
    <div className="flex items-center gap-3">
      {picture ? (
        <Image
          src={picture}
          alt={name}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="hidden md:block">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        {email && <p className="text-xs text-gray-500">{email}</p>}
      </div>
    </div>
  );
}
