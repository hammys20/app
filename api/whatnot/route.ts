import { NextResponse } from "next/server";

const WHATNOT_URL = "https://www.whatnot.com/user/hammys_trading";

// Optional fallback if scraping fails (set in .env.local):
// NEXT_SHOW_ISO=2026-02-01T20:00:00-05:00
const FALLBACK_NEXT_SHOW_ISO = process.env.NEXT_SHOW_ISO || "";

function extractStartTimeIso(html: string): string | null {
  const patterns = [
    /"startAt"\s*:\s*"([^"]+)"/i,
    /"startTime"\s*:\s*"([^"]+)"/i,
    /"start_time"\s*:\s*"([^"]+)"/i,
    /"scheduledStartAt"\s*:\s*"([^"]+)"/i,
    /"startDate"\s*:\s*"([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export async function GET() {
  let nextStartIso: string | null = null;

  try {
    const res = await fetch(WHATNOT_URL, {
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    nextStartIso = extractStartTimeIso(html);
  } catch {
    // ignore
  }

  if (!nextStartIso && FALLBACK_NEXT_SHOW_ISO) nextStartIso = FALLBACK_NEXT_SHOW_ISO;

  const now = Date.now();
  const startMs = nextStartIso ? Date.parse(nextStartIso) : NaN;

  // If we know the start time, assume "live" for 4 hours after start.
  const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;

  const isLive = Number.isFinite(startMs) && now >= startMs && now <= startMs + LIVE_WINDOW_MS;
  const msUntilStart = Number.isFinite(startMs) ? Math.max(0, startMs - now) : null;

  return NextResponse.json({
    whatnotUrl: WHATNOT_URL,
    nextStartIso: nextStartIso ?? null,
    isLive,
    msUntilStart,
  });
}
