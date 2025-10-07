"use client";

import { useInitializeUser } from "@/features/user/hooks/use-initialize-user";

export function UserInitializer({ children }: { children: React.ReactNode }) {
  useInitializeUser();
  return <>{children}</>;
}