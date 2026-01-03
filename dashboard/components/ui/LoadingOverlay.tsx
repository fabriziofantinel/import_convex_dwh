"use client";

/**
 * LoadingOverlay Component
 * Full-screen or container overlay with loading spinner
 * Requirements: 9.4
 */

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  text = "Loading...",
  fullScreen = false,
  className = ""
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  const overlayClasses = fullScreen 
    ? "fixed inset-0 z-50" 
    : "absolute inset-0 z-10";

  return (
    <div className={`${overlayClasses} bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}