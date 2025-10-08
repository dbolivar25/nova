"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const splash = document.getElementById("nova-splash");

    if (!splash) {
      return;
    }

    splash.classList.remove("opacity-100");
    splash.classList.add("opacity-0");

    const removeSplash = () => {
      splash.remove();
    };

    splash.addEventListener("transitionend", removeSplash, { once: true });

    const fallbackTimeout = window.setTimeout(removeSplash, 700);

    return () => {
      splash.removeEventListener("transitionend", removeSplash);
      window.clearTimeout(fallbackTimeout);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
        />
      </NextThemesProvider>
      {process.env.NODE_ENV !== "production" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
