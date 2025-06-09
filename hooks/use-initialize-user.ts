"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useInitializeUser() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    async function initializeUser() {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          console.error("Failed to initialize user:", await response.text());
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    }

    initializeUser();
  }, [user, isLoaded]);
}