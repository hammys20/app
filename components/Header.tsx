import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        background: "#0b0b0b",
        borderBottom: "1px solid rgba(255,215,0,0.25)",
        padding: "14px 20px",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          textDecoration: "none",
        }}
      >
        <Image
          src="/hammys-logo.png"
          alt="Hammy’s Trading"
          width={64}
          height={64}
          priority
        />

        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "#FFD700",
            }}
          >
            HAMMY’S TRADING
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#aaa",
              marginTop: 2,
            }}
          >
            Singles • Slabs • Live Breaks
          </div>
        </div>
      </Link>
    </header>
  );
}


