import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(247,248,250,0.9)",
        backdropFilter: "blur(12px)",
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
              boxShadow: "0 6px 18px rgba(15,23,42,0.15)",
            }}
          />

          <div>
            <div
              style={{
                fontWeight: 900,
                letterSpacing: 0.4,
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
                letterSpacing: 0.3,
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
          <Link href="/inventory" className="btn" style={{ textDecoration: "none" }}>
            Inventory
          </Link>

          <Link
            href="https://www.whatnot.com/s/UlNKtYo1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              borderColor: "rgba(184,134,11,0.35)",
            }}
          >
            Live on Whatnot
          </Link>

          <Link
            href="/admin"
            className="btn btnPrimary"
            style={{
              textDecoration: "none",
            }}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
