import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const STORAGE_KEY = "nowPlaying.settings.v2";

const defaultSettings = {
  enabled: true,
  label: "Now playing",
  title: "Ambient focus mix",
  imageUrl: "/assets/img/logo-mini.png",
  expiresAt: null,
  showEqualizer: true,
  showImage: true,
  lastUpdated: Date.now(),
  lastfmEnabled: true,
};

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL || "",
    token: process.env.KV_REST_API_TOKEN || "",
  });
}

export async function GET() {
  try {
    const redis = getRedis();
    const settings: any = (await redis.get(STORAGE_KEY)) || defaultSettings;
    const finalSettings =
      typeof settings === "string" ? JSON.parse(settings) : settings;

    if (finalSettings.showEqualizer === undefined)
      finalSettings.showEqualizer = true;
    if (finalSettings.showImage === undefined)
      finalSettings.showImage = true;
    if (finalSettings.lastUpdated === undefined)
      finalSettings.lastUpdated = Date.now();

    if (
      finalSettings.enabled &&
      finalSettings.expiresAt &&
      Date.now() > finalSettings.expiresAt
    ) {
      finalSettings.enabled = false;
      finalSettings.expiresAt = null;
      finalSettings.lastUpdated = Date.now();
      await redis.set(STORAGE_KEY, finalSettings);
    }

    return NextResponse.json(finalSettings);
  } catch (kvError) {
    console.error("Redis fetch error:", kvError);
    return NextResponse.json(defaultSettings);
  }
}

export async function POST(req: NextRequest) {
  const envPassword = String(process.env.ADMIN_PASSWORD || "").trim();

  if (!envPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not set in Vercel environment." },
      { status: 500 }
    );
  }

  const passwordHeader = req.headers.get("x-admin-password") || "";
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputPassword = String(passwordHeader || body?.password || "").trim();

  if (!inputPassword || inputPassword !== envPassword) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        debug: {
          receivedLength: inputPassword.length,
          expectedLength: envPassword.length,
        },
      },
      { status: 401 }
    );
  }

  const { action, settings, durationMinutes } = body;

  if (action === "verify") {
    return NextResponse.json({ success: true });
  }

  try {
    const redis = getRedis();
    const newSettings = { ...settings, lastUpdated: Date.now() };
    if (durationMinutes && durationMinutes > 0) {
      newSettings.expiresAt = Date.now() + durationMinutes * 60 * 1000;
    } else if (durationMinutes === 0 || durationMinutes === -2) {
      newSettings.expiresAt = null;
    }

    await redis.set(STORAGE_KEY, newSettings);
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (kvError) {
    console.error("Redis update error:", kvError);
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    );
  }
}
