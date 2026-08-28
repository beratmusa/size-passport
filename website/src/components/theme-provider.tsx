"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Next.js 15 / React 19 currently throws a warning when next-themes injects its script.
// This is a known false positive and is completely safe to suppress.
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
