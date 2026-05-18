import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const passwordHeader = req.headers.get("x-admin-password");
  const envPassword = String(process.env.ADMIN_PASSWORD || "").trim();

  if (!passwordHeader || passwordHeader !== envPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType, data } = await req.json();

    if (!data || !filename) {
      return NextResponse.json(
        { error: "Missing data or filename" },
        { status: 400 }
      );
    }

    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const blob = await put(filename, buffer, {
      contentType,
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}
