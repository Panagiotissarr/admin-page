"use client";

import { useEffect, useMemo, useState } from "react";
import { useNowPlayingSettings } from "@/lib/nowPlayingSettings";

const PRESETS = [
  { label: "Now playing", title: "Ambient focus mix", imageUrl: "/assets/img/logo-mini.png" },
  { label: "Now eating", title: "Having a snack", imageUrl: "/assets/img/logo-mini.png" },
  { label: "Now coding", title: "Working on projects", imageUrl: "/assets/img/logo-mini.png" },
  { label: "Now gaming", title: "In a session", imageUrl: "/assets/img/logo-mini.png" },
];

const DURATIONS = [
  { label: "Never Expires", value: -2 },
  { label: "1 min", value: 1 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "Custom", value: -1 },
];

export default function AdminPage() {
  const { settings, updateSettings, verifyPassword, isLoading } = useNowPlayingSettings();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [safetyLock, setSafetyLock] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [duration, setDuration] = useState(-2);
  const [customDuration, setCustomDuration] = useState(120);

  const formState = useMemo(
    () => ({
      enabled: settings.enabled,
      label: settings.label,
      title: settings.title,
      imageUrl: settings.imageUrl,
      showEqualizer: settings.showEqualizer ?? true,
      showImage: settings.showImage ?? true,
      lastfmEnabled: settings.lastfmEnabled ?? true,
    }),
    [settings]
  );

  const [draft, setDraft] = useState(formState);

  useEffect(() => {
    setDraft(formState);
  }, [formState]);

  useEffect(() => {
    if (unlocked) {
      const timer = setTimeout(() => {
        setUnlocked(false);
        setSafetyLock(true);
        setStatus("Session expired (Auto-locked)");
      }, 5 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [unlocked]);

  const handleUnlock = async () => {
    if (pin.length === 0) return;
    setIsVerifying(true);
    setStatus("Verifying...");
    try {
      const success = await verifyPassword(pin);
      setIsVerifying(false);
      if (success) {
        setUnlocked(true);
        setStatus("Unlocked");
        setSafetyLock(false);
      } else {
        setStatus("Unauthorized (Check your password/env var)");
      }
    } catch {
      setIsVerifying(false);
      setStatus("Server error. Check Vercel logs.");
    }
  };

  const handleDigit = (digit: string) => {
    setPin((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  useEffect(() => {
    if (unlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter") {
        handleUnlock();
      } else if (e.key === "Escape") {
        handleClear();
      } else if (e.key.length === 1) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          handleDigit(e.key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [unlocked, pin]);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setDraft((prev) => ({
      ...prev,
      label: preset.label,
      title: preset.title,
      imageUrl: preset.imageUrl,
      enabled: true,
    }));
  };

  const handleSave = async () => {
    setStatus("Saving...");
    try {
      const finalDuration = duration === -1 ? customDuration : duration;
      await updateSettings(draft, pin, finalDuration);
      setStatus("Applied globally");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleSafetyLockToggle = (checked: boolean) => {
    if (checked) {
      setUnlocked(false);
      setSafetyLock(true);
      setStatus("Locked out by Safety Lock");
    } else {
      setSafetyLock(false);
    }
  };

  const isDisabled = !unlocked || safetyLock || isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white font-sans">
      <div className="mx-auto max-w-xl space-y-6 rounded-magic-out border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/60">
              Secure panel for real-time website updates.
            </p>
          </div>
          <a
            href="/"
            className="shrink-0 text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            &larr; Dashboard
          </a>
        </div>

        {!unlocked && (
          <div className="space-y-3">
            <label className="text-sm text-white/70">Master Password</label>
            <div className="flex flex-wrap items-center justify-center gap-2 py-2">
              {Array.from({ length: Math.max(pin.length, 6) }).map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                    index < pin.length
                      ? "border-primary bg-primary scale-110 shadow-[0_0_8px_rgba(72,80,224,0.5)]"
                      : "border-white/30"
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="h-14 rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-white hover:bg-white/10 active:scale-95 transition-transform"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-14 rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/70 hover:bg-white/10"
              >
                Clear
              </button>
              <button
                onClick={() => handleDigit("0")}
                className="h-14 rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-white hover:bg-white/10 active:scale-95 transition-transform"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/70 hover:bg-white/10"
              >
                Del
              </button>
            </div>

            <button
              onClick={handleUnlock}
              disabled={isVerifying || pin.length === 0}
              className="w-full rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Unlock"}
            </button>
            <p className="text-[10px] text-center text-white/20">
              Use keyboard digits or click. Enter to unlock.
            </p>
          </div>
        )}

        {unlocked && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <label className="flex items-center justify-between text-sm text-white/70">
              Safety lock (Locks you out)
              <input
                type="checkbox"
                checked={safetyLock}
                onChange={(e) => handleSafetyLockToggle(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black"
              />
            </label>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    disabled={isDisabled}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 pt-2">
              <label className="flex items-center justify-between text-sm text-white/70">
                Enable widget
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black"
                  disabled={isDisabled}
                />
              </label>

              <label className="flex items-center justify-between text-sm text-white/70">
                Show image
                <input
                  type="checkbox"
                  checked={draft.showImage}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, showImage: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black"
                  disabled={isDisabled}
                />
              </label>

              <label className="flex items-center justify-between text-sm text-white/70">
                Show equalizer animation
                <input
                  type="checkbox"
                  checked={draft.showEqualizer}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, showEqualizer: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black"
                  disabled={isDisabled}
                />
              </label>

              <label className="flex items-center justify-between text-sm text-white/70">
                Check for Last.fm
                <input
                  type="checkbox"
                  checked={draft.lastfmEnabled}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, lastfmEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black"
                  disabled={isDisabled}
                />
              </label>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Label
                </label>
                <input
                  type="text"
                  value={draft.label}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:outline-none focus:border-white/30"
                  disabled={isDisabled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:outline-none focus:border-white/30"
                  disabled={isDisabled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Image URL
                </label>
                <input
                  type="text"
                  value={draft.imageUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:outline-none focus:border-white/30"
                  disabled={isDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => setDuration(d.value)}
                    disabled={isDisabled}
                    className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                      duration === d.value
                        ? "border-primary bg-primary/20 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {duration === -1 && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-24 rounded-md border border-white/10 bg-black/40 px-3 py-1 text-sm text-white"
                    disabled={isDisabled}
                  />
                  <span className="text-xs text-white/40">minutes</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              className="w-full rounded-md bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              disabled={isDisabled}
            >
              Apply to All Users
            </button>
          </div>
        )}

        {status && (
          <p
            className={`text-center text-xs ${
              status.includes("Unauthorized") ||
              status.includes("Locked") ||
              status.includes("error")
                ? "text-red-400"
                : "text-white/40"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
