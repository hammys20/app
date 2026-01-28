import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Hammy’s Trading</h1>
      <Link href="/inventory" style={{ color: "#FFD700", fontWeight: 800 }}>
        View Inventory →
      </Link>
    </div>
  );
}

