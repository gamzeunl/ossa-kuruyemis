"use client";

import { useEffect, useRef } from "react";

export function FormError({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) {
      ref.current?.focus();
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 focus:outline-none dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      {message}
    </div>
  );
}
