"use client";

import { useEffect, useMemo, useState, useRef } from "react";

export type NowPlayingSettings = {
  enabled: boolean;
  label: string;
  title: string;
  imageUrl: string;
  expiresAt?: number | null;
  showEqualizer?: boolean;
  showImage?: boolean;
  lastUpdated?: number;
  lastfmEnabled?: boolean;
};

const defaultSettings: NowPlayingSettings = {
  enabled: true,
  label: "Now playing",
  title: "Ambient focus mix",
  imageUrl: "/assets/img/logo-mini.png",
  expiresAt: null,
  showEqualizer: true,
  showImage: true,
  lastUpdated: 0,
  lastfmEnabled: true,
};

export const useNowPlayingSettings = () => {
  const [settings, setSettings] = useState<NowPlayingSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdatedRef = useRef<number>(0);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/debug");
      if (response.ok) {
        const data = await response.json();
        if (data.showEqualizer === undefined) data.showEqualizer = true;
        if (data.showImage === undefined) data.showImage = true;
        if (data.lastfmEnabled === undefined) data.lastfmEnabled = true;

        const serverLastUpdated = data.lastUpdated || 0;
        if (serverLastUpdated > lastUpdatedRef.current) {
          lastUpdatedRef.current = serverLastUpdated;
          if (data.enabled && data.expiresAt && Date.now() > data.expiresAt) {
            setSettings({ ...data, enabled: false });
          } else {
            setSettings(data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 7000);
    return () => clearInterval(interval);
  }, []);

  const verifyPassword = async (password: string) => {
    const response = await fetch("/api/debug", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ password, action: "verify" }),
    });
    return response.ok;
  };

  const updateSettings = async (
    next: NowPlayingSettings,
    password: string,
    durationMinutes?: number
  ) => {
    const response = await fetch("/api/debug", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ password, settings: next, durationMinutes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const debugInfo = errorData.debug
        ? ` (Received: ${errorData.debug.receivedLength}, Expected: ${errorData.debug.expectedLength})`
        : "";
      throw new Error((errorData.error || "Update failed") + debugInfo);
    }

    const data = await response.json();
    lastUpdatedRef.current = data.settings.lastUpdated || Date.now();
    setSettings(data.settings);
  };

  return useMemo(
    () => ({
      settings,
      isLoading,
      updateSettings,
      verifyPassword,
      refresh: fetchSettings,
    }),
    [settings, isLoading]
  );
};
