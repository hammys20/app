"use client";

import { useEffect, useMemo, useState } from "react";

type Status = {
  whatnotUrl: string;
  nextStartIso: string | null;
  isLive: boolean;
  msUntilStart: number | null;
};

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function WhatnotStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/whatnot", { cache: "no-store" });
        const json = (await res.json()) as Status;
        if (mounted) setStatus(json);
      } catch {
        if (mounted) setStatus(null);
      }
    }

    load();
    const poll = setInterval(load, 60_000); // refresh every minute
    const t = setInterval(() => setTick(Date.now()), 1_000); // smooth countdown

    return () => {
      mounted = false;
      clearInterval(poll);
      clearInterval(t);
    };
  }, []);

  const countdown = useMemo(() => {
    if (!status?.msUntilStart || status.msUntilStart <= 0) return null;
    // approximate remaining using local tick between polls
    const elapsed = Date.now() - tick;
    const remaining = Math.max(0, status.msUntilStart - elapsed);
    return formatCountdown(remaining);
  }, [status, tick]);

  if (!status) {
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href="https://www.whatnot.com/user/hammys_trading"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btnPrimary"
        >
          Visit Whatnot Channel
        </a>
        <a
          href="https://www.whatnot.com/user/hammys_trading"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Follow for Live Alerts
        </a>
      </div>
    );
  }

  const showCountdown = !status.isLive && typeof status.msUntilStart === "number";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {status.isLive ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(15,23,42,0.78)",
            color: "#fff",
            fontWeight: 900,
            letterSpacing: 0.2,
            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.10)",
          }}
        >
          <span style={{ color: "var(--accent)" }}>🔴</span> LIVE NOW
        </span>
      ) : showCountdown ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            border: "1px solid rgba(184, 134, 11, 0.35)",
            color: "var(--accent)",
            fontWeight: 900,
            letterSpacing: 0.2,
          }}
        >
          🕒 Next break starts in <span style={{ color: "var(--text)" }}>{countdown}</span>
        </span>
      ) : null}

      <a
        href={status.whatnotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btnPrimary"
      >
        Visit Whatnot Channel
      </a>

      <a href={status.whatnotUrl} target="_blank" rel="noopener noreferrer" className="btn">
        Follow for Live Alerts
      </a>
    </div>
  );
}
