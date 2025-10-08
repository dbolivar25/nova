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

  const hideSplashScreen = React.useCallback(() => {
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
  }, [getSplash]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleRecoveryStorageKey = "nova:reloaded-for-missing-styles";
    let isRecovering = false;
    let isDisposed = false;

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

    const withCacheBuster = (href: string, cacheBuster: string) => {
      try {
        const url = new URL(href, window.location.href);
        url.searchParams.set("nova-style-reload", cacheBuster);
        return url.toString();
      } catch (error) {
        console.error("Failed to build cache-busted stylesheet URL", error);
        return href;
      }
    };

    const reloadStylesheets = async () => {
      const linkElements = Array.from(
        document.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"][data-n-p], link[rel="stylesheet"][data-precedence]'
        )
      );
      const styleElements = Array.from(
        document.querySelectorAll<HTMLStyleElement>('style[data-n-href]')
      );

      if (linkElements.length === 0 && styleElements.length === 0) {
        return false;
      }

      const cacheBuster = Date.now().toString();

      const linkReloads = linkElements.map(
        (link) =>
          new Promise<void>((resolve) => {
            const originalHref =
              link.dataset.novaOriginalHref ?? link.getAttribute("href") ?? link.href;
            link.dataset.novaOriginalHref = originalHref;

            const replacement = link.cloneNode(true) as HTMLLinkElement;
            replacement.dataset.novaOriginalHref = originalHref;
            replacement.href = withCacheBuster(originalHref, cacheBuster);
            replacement.onload = () => resolve();
            replacement.onerror = () => resolve();

            link.replaceWith(replacement);
          })
      );

      const styleReloads = styleElements.map((style) => {
        const href = style.dataset.nHref;

        if (!href) {
          return Promise.resolve();
        }

        return fetch(withCacheBuster(href, cacheBuster), { cache: "reload" })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to reload stylesheet ${href}`);
            }

            return response.text();
          })
          .then((cssText) => {
            style.textContent = cssText;
          })
          .catch((error) => {
            console.error("Failed to refresh inline stylesheet", error);
          });
      });

      await Promise.all([...linkReloads, ...styleReloads]);

      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (hasTailwindStylesApplied()) {
          return true;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 100));
      }

      return hasTailwindStylesApplied();
    };

    const recoverFromMissingStyles = async () => {
      if (isRecovering) {
        return;
      }

      if (hasTailwindStylesApplied()) {
        resetRecoveryFlag();
        return;
      }

      const shouldSkipReload = markRecoveryAttempt();

      if (shouldSkipReload) {
        return;
      }

      isRecovering = true;
      showSplashScreen();

      try {
        const recovered = await reloadStylesheets();

        if (isDisposed) {
          return;
        }

        if (recovered) {
          resetRecoveryFlag();
          hideSplashScreen();
          return;
        }

        window.location.reload();
      } finally {
        isRecovering = false;
      }
    };

    const scheduleRecoveryCheck = () => {
      window.setTimeout(() => {
        void recoverFromMissingStyles();
      }, 50);
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
      isDisposed = true;
      isRecovering = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [hideSplashScreen, showSplashScreen]);

  React.useEffect(() => {
    hideSplashScreen();

    return () => {
      if (hideSplashAnimationFrameRef.current !== null) {
        cancelAnimationFrame(hideSplashAnimationFrameRef.current);
        hideSplashAnimationFrameRef.current = null;
      }

      hideSplashCleanupRef.current?.();
      hideSplashCleanupRef.current = null;
    };
  }, [hideSplashScreen]);

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
