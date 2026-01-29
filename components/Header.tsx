"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      try {
        const session = await fetchAuthSession();
        const groups =
          (session.tokens?.accessToken?.payload[
            "cognito:groups"
          ] as string[]) ?? [];

        if (!mounted) return;

        setIsSignedIn(!!session.tokens);
        setIsAdmin(groups.includes("Admin"));
      } catch {
        if (!mounted) return;
        setIsSignedIn(false);
        setIsAdmin(false);
      } finally {
        if (mounted) setLoaded(true);
      }
    }

    loadAuth();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(27,30,36,0.88)",
        backdropFilter: "blur(14px)",
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
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        {/* BRAND */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
          }}
        >
          <Image
            src="/hammys-logo.png"
            alt="Hammy’s Trading"
            width={46}
            height={46}
            priority
            style={{
              borderRadius: 14,
              boxShadow: "0 8px 26px rgba(0,0,0,0.7)",
            }}
          />

          <div>
            <div
              style={{
                fontWeight: 900,
                letterSpacing: 0.6,
                fontSize: 16,
              }}
            >
              Hammy’s Trading
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                marginTop: 2,
                letterSpacing: 0.35,
              }}
            >
              Premium Pokémon Cards & Live Breaks
            </div>
          </div>
        </Link>

        {/* NAV */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Link href="/inventory" className="btn">
            Inventory
          </Link>

          <Link
            href="https://www.whatnot.com/user/hammys_trading"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ borderColor: "rgba(201,162,77,0.45)" }}
          >
            Live on Whatnot
          </Link>

          {/* Admin link ONLY when signed in + Admin */}
          {loaded && isSignedIn && isAdmin && (
            <Link href="/admin/inventory" className="btn btnPrimary">
              Admin
            </Link>
          )}

          {/* Auth action */}
          {loaded && isSignedIn ? (
            <button className="btn" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <Link href="/signin" className="btn">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
