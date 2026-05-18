"use client";

import { useEffect, useMemo, useState } from "react";
import { useNowPlayingSettings } from "@/lib/nowPlayingSettings";
import { useAuth } from "@/lib/auth-context";

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
  const { pin, logout } = useAuth();
  const { settings, updateSettings, isLoading } = useNowPlayingSettings();
  const [safetyLock, setSafetyLock] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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

  const isDisabled = safetyLock || isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white font-sans">
      <div className="w-full max-w-xl space-y-6 rounded-magic-out border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/60">
              Secure panel for real-time website updates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="shrink-0 text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              &larr; Dashboard
            </a>
            <button
              onClick={logout}
              className="shrink-0 text-xs text-white/40 hover:text-red-400 transition-colors"
            >
              Lock
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm text-white/70">
            Safety lock (Locks you out)
            <input
              type="checkbox"
              checked={safetyLock}
              onChange={(e) => setSafetyLock(e.target.checked)}
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
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      label: p.label,
                      title: p.title,
                      imageUrl: p.imageUrl,
                      enabled: true,
                    }))
                  }
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

        {status && (
          <p
            className={`text-center text-xs ${
              status.includes("error") || status.includes("Unauthorized")
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
