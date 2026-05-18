"use client";

import { useState, useEffect, useCallback } from "react";

export type CustomPreset = {
  id: string;
  label: string;
  title: string;
  imageUrl: string;
  enabled: boolean;
  showEqualizer: boolean;
  showImage: boolean;
  lastfmEnabled: boolean;
};

const STORAGE_KEY = "admin-custom-presets";

export function useCustomPresets() {
  const [presets, setPresets] = useState<CustomPreset[]>([]);
  const [clipboard, setClipboard] = useState<CustomPreset | null>(null);
  const [cutSourceId, setCutSourceId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch {
        /* ignore corrupt data */
      }
    }
  }, []);

  const save = useCallback((next: CustomPreset[]) => {
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(
    (data: Omit<CustomPreset, "id">) => {
      const p: CustomPreset = { ...data, id: Date.now().toString() };
      save([...presets, p]);
      return p;
    },
    [presets, save]
  );

  const remove = useCallback(
    (id: string) => {
      save(presets.filter((p) => p.id !== id));
    },
    [presets, save]
  );

  const copy = useCallback(
    (id: string) => {
      const p = presets.find((p) => p.id === id);
      if (p) {
        setClipboard({ ...p });
        setCutSourceId(null);
      }
    },
    [presets]
  );

  const cut = useCallback(
    (id: string) => {
      const p = presets.find((p) => p.id === id);
      if (p) {
        setClipboard({ ...p });
        setCutSourceId(id);
      }
    },
    [presets]
  );

  const paste = useCallback(() => {
    if (!clipboard) return;
    const p: CustomPreset = { ...clipboard, id: Date.now().toString() };
    if (cutSourceId) {
      save(presets.map((x) => (x.id === cutSourceId ? p : x)));
      setCutSourceId(null);
    } else {
      save([...presets, p]);
    }
    setClipboard(null);
  }, [clipboard, cutSourceId, presets, save]);

  const duplicate = useCallback(
    (id: string) => {
      const p = presets.find((p) => p.id === id);
      if (p) {
        save([
          ...presets,
          { ...p, id: Date.now().toString(), label: p.label + " (copy)" },
        ]);
      }
    },
    [presets, save]
  );

  return { presets, clipboard, add, remove, copy, cut, paste, duplicate };
}
