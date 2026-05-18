"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useNowPlayingSettings } from "@/lib/nowPlayingSettings";
import { useAuth } from "@/lib/auth-context";
import { useCustomPresets, type CustomPreset } from "@/lib/useCustomPresets";
import { ContextMenu, type ContextMenuItem } from "@/components/context-menu";

const BUILTIN_PRESETS = [
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
  const { presets: customPresets, add: addPreset, remove: removePreset, copy, cut, paste, duplicate } = useCustomPresets();
  const [status, setStatus] = useState<string | null>(null);
  const [duration, setDuration] = useState(-2);
  const [customDuration, setCustomDuration] = useState(120);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ label: "Now playing", title: "My custom track", imageUrl: "/assets/img/logo-mini.png", enabled: true, showEqualizer: true, showImage: true, lastfmEnabled: true });
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; presetId: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const applyPreset = useCallback((p: { label: string; title: string; imageUrl: string; enabled?: boolean }) => {
    setDraft((prev) => ({ ...prev, label: p.label, title: p.title, imageUrl: p.imageUrl, enabled: p.enabled ?? true }));
  }, []);

  const applyCustomPreset = useCallback((p: CustomPreset) => {
    setDraft({
      enabled: p.enabled,
      label: p.label,
      title: p.title,
      imageUrl: p.imageUrl,
      showEqualizer: p.showEqualizer,
      showImage: p.showImage,
      lastfmEnabled: p.lastfmEnabled,
    });
  }, []);

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

  const handleContextAction = useCallback((action: string, presetId: string) => {
    switch (action) {
      case "copy": copy(presetId); break;
      case "cut": cut(presetId); break;
      case "paste": paste(); break;
      case "duplicate": duplicate(presetId); break;
      case "delete": removePreset(presetId); break;
    }
  }, [copy, cut, paste, duplicate, removePreset]);

  useEffect(() => {
    if (!ctxMenu) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "c": copy(ctxMenu.presetId); setCtxMenu(null); break;
          case "x": cut(ctxMenu.presetId); setCtxMenu(null); break;
          case "v": paste(); setCtxMenu(null); break;
          case "d": duplicate(ctxMenu.presetId); setCtxMenu(null); e.preventDefault(); break;
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ctxMenu, copy, cut, paste, duplicate]);

  const handleAddFormSubmit = useCallback(() => {
    const preset = addPreset(addForm);
    applyCustomPreset(preset);
    setShowAddForm(false);
  }, [addForm, addPreset, applyCustomPreset]);

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
            <Link
              href="/"
              className="shrink-0 text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              &larr; Dashboard
            </Link>
            <button
              onClick={logout}
              className="shrink-0 text-xs text-white/40 hover:text-red-400 transition-colors"
            >
              Lock
            </button>
          </div>
        </div>

        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            onClose={() => setCtxMenu(null)}
            items={[
              { label: "Cut", shortcut: "Ctrl+X", action: () => handleContextAction("cut", ctxMenu.presetId) },
              { label: "Copy", shortcut: "Ctrl+C", action: () => handleContextAction("copy", ctxMenu.presetId) },
              { label: "Paste", shortcut: "Ctrl+V", action: () => handleContextAction("paste", ctxMenu.presetId) },
              { label: "Duplicate", shortcut: "Ctrl+D", action: () => handleContextAction("duplicate", ctxMenu.presetId) },
              { divider: true, label: "", action: () => {} },
              { label: "Delete", action: () => handleContextAction("delete", ctxMenu.presetId) },
            ] as ContextMenuItem[]}
          />
        )}

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="w-full max-w-md space-y-4 rounded-magic-out border border-white/10 bg-zinc-900 p-6 backdrop-blur-md">
              <h2 className="text-base font-semibold">New Preset</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Label</label>
                  <input value={addForm.label} onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Title</label>
                  <input value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Image URL</label>
                  <input value={addForm.imageUrl} onChange={(e) => setAddForm((f) => ({ ...f, imageUrl: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <input type="checkbox" checked={addForm.enabled} onChange={(e) => setAddForm((f) => ({ ...f, enabled: e.target.checked }))} className="h-3.5 w-3.5 rounded border-white/20 bg-black" /> Enabled
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <input type="checkbox" checked={addForm.showImage} onChange={(e) => setAddForm((f) => ({ ...f, showImage: e.target.checked }))} className="h-3.5 w-3.5 rounded border-white/20 bg-black" /> Show image
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <input type="checkbox" checked={addForm.showEqualizer} onChange={(e) => setAddForm((f) => ({ ...f, showEqualizer: e.target.checked }))} className="h-3.5 w-3.5 rounded border-white/20 bg-black" /> Equalizer
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <input type="checkbox" checked={addForm.lastfmEnabled} onChange={(e) => setAddForm((f) => ({ ...f, lastfmEnabled: e.target.checked }))} className="h-3.5 w-3.5 rounded border-white/20 bg-black" /> Last.fm
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleAddFormSubmit} className="flex-1 rounded-md bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90">Save & Apply</button>
                  <button onClick={() => setShowAddForm(false)} className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">Presets</label>
              <button
                onClick={() => { setAddForm({ label: draft.label, title: draft.title, imageUrl: draft.imageUrl, enabled: draft.enabled, showEqualizer: draft.showEqualizer, showImage: draft.showImage, lastfmEnabled: draft.lastfmEnabled }); setShowAddForm(true); }}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUILTIN_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  disabled={isLoading}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
              {customPresets.map((p) => (
                <div key={p.id} className="relative group">
                  <button
                    onClick={() => applyCustomPreset(p)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedId(p.id);
                      setCtxMenu({ x: e.clientX, y: e.clientY, presetId: p.id });
                    }}
                    disabled={isLoading}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 pr-7 text-xs hover:bg-white/10 disabled:opacity-50 relative"
                  >
                    {p.title}
                    <span
                      onClick={(e) => { e.stopPropagation(); removePreset(p.id); }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 invisible group-hover:visible text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/5 pt-2">
            <label className="flex items-center justify-between text-sm text-white/70">
              Enable widget
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black"
                disabled={isLoading}
              />
            </label>

            <label className="flex items-center justify-between text-sm text-white/70">
              Show image
              <input
                type="checkbox"
                checked={draft.showImage}
                onChange={(e) => setDraft((prev) => ({ ...prev, showImage: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black"
                disabled={isLoading}
              />
            </label>

            <label className="flex items-center justify-between text-sm text-white/70">
              Show equalizer animation
              <input
                type="checkbox"
                checked={draft.showEqualizer}
                onChange={(e) => setDraft((prev) => ({ ...prev, showEqualizer: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black"
                disabled={isLoading}
              />
            </label>

            <label className="flex items-center justify-between text-sm text-white/70">
              Check for Last.fm
              <input
                type="checkbox"
                checked={draft.lastfmEnabled}
                onChange={(e) => setDraft((prev) => ({ ...prev, lastfmEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black"
                disabled={isLoading}
              />
            </label>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">Label</label>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:outline-none focus:border-white/30"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">Title</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:outline-none focus:border-white/30"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">Image URL</label>
              <input
                type="text"
                value={draft.imageUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:outline-none focus:border-white/30"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-white/40">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setDuration(d.value)}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <span className="text-xs text-white/40">minutes</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-md bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            disabled={isLoading}
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
