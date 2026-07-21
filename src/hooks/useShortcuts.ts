"use client";

import { useEffect } from "react";

type ShortcutMap = {
  [key: string]: (e: KeyboardEvent) => void;
};

export function useShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        // Allow Ctrl+K even in inputs if desired, or skip it.
        // Let's skip single letter shortcuts in inputs, but allow meta combinations.
        if (!e.metaKey && !e.ctrlKey && e.key !== "Escape") {
          return;
        }
      }

      // Build key combination string (e.g., "Ctrl+k", "Shift+N")
      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push("Ctrl");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");
      
      const keyName = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      
      // If only a modifier is pressed, don't trigger
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      
      keys.push(keyName);
      const combo = keys.join("+");

      // Match against the map (e.g. "Ctrl+k", "n", "/", "Escape")
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
