"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, login, status } = useAuth();
  const [input, setInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        setInput((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Escape") {
        setInput("");
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setInput((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, isAuthenticated, input]);

  const handleSubmit = async () => {
    if (input.length === 0) return;
    setIsVerifying(true);
    await login(input);
    setIsVerifying(false);
  };

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="w-full max-w-sm space-y-6 rounded-magic-out border border-white/10 bg-white/5 p-6 backdrop-blur-md text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
          <p className="text-sm text-white/40">Enter master password to continue</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 py-2">
          {Array.from({ length: Math.max(input.length, 6) }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                i < input.length
                  ? "border-primary bg-primary scale-110 shadow-[0_0_8px_rgba(72,80,224,0.5)]"
                  : "border-white/30"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => setInput((prev) => prev + d)}
              className="h-14 rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-white hover:bg-white/10 active:scale-95 transition-transform"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setInput("")}
            className="h-14 rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/70 hover:bg-white/10"
          >
            Clear
          </button>
          <button
            onClick={() => setInput((prev) => prev + "0")}
            className="h-14 rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            0
          </button>
          <button
            onClick={() => setInput((prev) => prev.slice(0, -1))}
            className="h-14 rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/70 hover:bg-white/10"
          >
            Del
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isVerifying || input.length === 0}
          className="w-full rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-50"
        >
          {isVerifying ? "Verifying..." : "Unlock"}
        </button>

        <p className="text-[10px] text-white/20">
          Use keyboard digits or click. Enter to unlock.
        </p>

        {status && (
          <p className="text-center text-xs text-red-400">{status}</p>
        )}
      </div>
    </div>
  );
}
