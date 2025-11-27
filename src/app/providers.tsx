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

    const handleTransitionEnd = () => {
      splash.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(fallbackTimeout);
      splash.remove();
    };

    const fallbackTimeout = window.setTimeout(() => {
      splash.removeEventListener("transitionend", handleTransitionEnd);
      splash.remove();
    }, 700);

    splash.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      splash.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(fallbackTimeout);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const hasTailwindStyles = () => {
      const probe = document.createElement("div");
      probe.className = "hidden";
      document.body.appendChild(probe);
      const isHidden = window.getComputedStyle(probe).display === "none";
      probe.remove();
      return isHidden;
    };

    const refreshStyles = () => {
      const cacheBuster = Date.now().toString();
      const links = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"][data-n-p], link[rel="stylesheet"][data-precedence]'
      );

      links.forEach((link) => {
        const href = link.getAttribute("href");

        if (!href) {
          return;
        }

        const url = new URL(href, window.location.href);
        url.searchParams.set("nova-style-reload", cacheBuster);
        link.href = url.toString();
      });
    };

    const handleRestore = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (!hasTailwindStyles()) {
        refreshStyles();
      }
    };

    window.addEventListener("pageshow", handleRestore);
    document.addEventListener("visibilitychange", handleRestore);

    handleRestore();

    return () => {
      window.removeEventListener("pageshow", handleRestore);
      document.removeEventListener("visibilitychange", handleRestore);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        storageKey="nova-theme"
        themes={["light", "sunset", "dark"]}
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
