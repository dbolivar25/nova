"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CommandPalette } from "@/components/shared/layout/command-palette";

interface CommandContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export function useCommand() {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error("useCommand must be used within a CommandProvider");
  }
  return context;
}

const TEXT_INPUT_TYPES = new Set([
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
]);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    const type = target.type ? target.type.toLowerCase() : "text";
    return !type || TEXT_INPUT_TYPES.has(type);
  }

  if (target instanceof HTMLSelectElement) {
    return true;
  }

  const editableAncestor = target.closest("[contenteditable]");
  return editableAncestor instanceof HTMLElement
    ? editableAncestor.isContentEditable
    : false;
}

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);

  // Handle keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      const typingTarget = isEditableTarget(e.target);
      const shouldIgnore =
        typingTarget && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== "Escape";

      if (shouldIgnore) {
        return;
      }

      // Additional shortcuts when command palette is closed
      if (!open) {
        // G + D = Go to Dashboard
        if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          const listener = (e2: KeyboardEvent) => {
            const typingTargetInner = isEditableTarget(e2.target);
            const shouldIgnoreInner =
              typingTargetInner &&
              !e2.metaKey &&
              !e2.ctrlKey &&
              !e2.altKey &&
              e2.key !== "Escape";

            if (shouldIgnoreInner) {
              document.removeEventListener("keydown", listener);
              return;
            }

            if (e2.key === "d") {
              e2.preventDefault();
              window.location.href = "/dashboard";
            } else if (e2.key === "t") {
              e2.preventDefault();
              window.location.href = "/journal/today";
            } else if (e2.key === "j") {
              e2.preventDefault();
              window.location.href = "/journal";
            } else if (e2.key === "n") {
              e2.preventDefault();
              window.location.href = "/nova";
            } else if (e2.key === "i") {
              e2.preventDefault();
              window.location.href = "/insights";
            }
            document.removeEventListener("keydown", listener);
          };
          document.addEventListener("keydown", listener);
          setTimeout(() => document.removeEventListener("keydown", listener), 1000);
        }
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  return (
    <CommandContext.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandContext.Provider>
  );
}