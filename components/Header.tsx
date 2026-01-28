import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid #eee" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
        <Image
          src="/logo.png"
          alt="Hammy’s Trading logo"
          width={44}
          height={44}
          priority
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Hammy’s Trading</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Live breaks • Singles • Slabs</div>
        </div>
      </Link>
    </header>
  );
}

