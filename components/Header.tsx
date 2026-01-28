"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const groups =
          (session.tokens?.accessToken?.payload["cognito:groups"] as string[]) ??
          [];
        setIsAdmin(groups.includes("Admin"));
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(247,248,250,0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
          }}
        >
          <Image
            src="/hammys-logo.png"
            alt="Hammy’s Trading"
            width={40}
            height={40}
            priority
            style={{
              borderRadius: 10,
              boxShadow: "0 4px 14px rgba(15,23,42,0.12)",
            }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 900, letterSpacing: 0.4, fontSize: 15 }}>
              Hammy’s Trading
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Singles • Slabs • Live Breaks
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/inventory" className="btn" style={{ textDecoration: "none" }}>
            Inventory
          </Link>

          {isAdmin ? (
            <Link href="/admin" className="btn btnPrimary" style={{ textDecoration: "none" }}>
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
