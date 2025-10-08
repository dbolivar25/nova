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
  const splashRef = React.useRef<HTMLElement | null>(null);
  const hideSplashCleanupRef = React.useRef<(() => void) | null>(null);
  const hideSplashAnimationFrameRef = React.useRef<number | null>(null);

  const getSplash = React.useCallback(() => {
    if (typeof document === "undefined") {
      return null;
    }

    if (splashRef.current) {
      return splashRef.current;
    }

    const splashElement = document.getElementById("nova-splash");

    if (splashElement instanceof HTMLElement) {
      if (!splashElement.dataset.originalDisplay) {
        splashElement.dataset.originalDisplay = splashElement.style.display || "";
      }

      splashRef.current = splashElement;
    }

    return splashRef.current;
  }, []);

  const showSplashScreen = React.useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }

    const splash = getSplash();

    if (!splash) {
      return;
    }

    if (hideSplashAnimationFrameRef.current !== null) {
      cancelAnimationFrame(hideSplashAnimationFrameRef.current);
      hideSplashAnimationFrameRef.current = null;
    }

    hideSplashCleanupRef.current?.();
    hideSplashCleanupRef.current = null;

    const originalDisplay = splash.dataset.originalDisplay ?? "";
    splash.style.display = originalDisplay;
    splash.classList.remove("pointer-events-none");

    // Force reflow so the transition can re-run if the splash was hidden.
    void splash.offsetWidth;

    splash.classList.remove("opacity-0");
    splash.classList.add("opacity-100");
  }, [getSplash]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleRecoveryStorageKey = "nova:reloaded-for-missing-styles";

    const hasTailwindStylesApplied = () => {
      const probe = document.createElement("div");
      probe.className = "hidden";
      document.body.appendChild(probe);
      const isHidden = window.getComputedStyle(probe).display === "none";
      probe.remove();
      return isHidden;
    };

    const resetRecoveryFlag = () => {
      try {
        sessionStorage.removeItem(styleRecoveryStorageKey);
      } catch (error) {
        console.error("Failed to clear style recovery flag", error);
      }
    };

    const markRecoveryAttempt = () => {
      try {
        const hasAttempted = sessionStorage.getItem(styleRecoveryStorageKey);

        if (hasAttempted) {
          return true;
        }

        sessionStorage.setItem(styleRecoveryStorageKey, "1");
      } catch (error) {
        console.error("Failed to persist style recovery attempt", error);
      }

      return false;
    };

    const recoverFromMissingStyles = () => {
      if (hasTailwindStylesApplied()) {
        resetRecoveryFlag();
        return;
      }

      const shouldSkipReload = markRecoveryAttempt();

      if (shouldSkipReload) {
        return;
      }

      showSplashScreen();
      window.location.reload();
    };

    const scheduleRecoveryCheck = () => {
      window.setTimeout(recoverFromMissingStyles, 50);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      scheduleRecoveryCheck();
    };

    const handlePageShow = (event: Event) => {
      const pageEvent = event as PageTransitionEvent;

      if (pageEvent.persisted) {
        scheduleRecoveryCheck();
      }
    };

    scheduleRecoveryCheck();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [showSplashScreen]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const splash = getSplash();

    if (!splash) {
      return;
    }

    let isHidden = false;

    const finalizeHide = () => {
      if (isHidden) {
        return;
      }

      isHidden = true;
      splash.classList.add("pointer-events-none");
      splash.style.display = "none";
    };

    hideSplashAnimationFrameRef.current = window.requestAnimationFrame(() => {
      splash.classList.remove("opacity-100");
      splash.classList.add("opacity-0");
    });

    const handleTransitionEnd = () => {
      finalizeHide();
    };

    splash.addEventListener("transitionend", handleTransitionEnd, { once: true });

    const fallbackTimeout = window.setTimeout(finalizeHide, 700);

    hideSplashCleanupRef.current = () => {
      splash.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(fallbackTimeout);
    };

    return () => {
      if (hideSplashAnimationFrameRef.current !== null) {
        cancelAnimationFrame(hideSplashAnimationFrameRef.current);
        hideSplashAnimationFrameRef.current = null;
      }

      hideSplashCleanupRef.current?.();
      hideSplashCleanupRef.current = null;
    };
  }, [getSplash]);

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
