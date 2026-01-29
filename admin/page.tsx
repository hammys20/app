import Link from "next/link";

export default function AdminHome() {
  return (
    <div style={{ maxWidth: 800, margin: "60px auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>
        Admin Dashboard
      </h1>

      <p style={{ opacity: 0.7, marginTop: 8 }}>
        Admin-only tools
      </p>

      <div style={{ marginTop: 32, display: "grid", gap: 16 }}>
        <Link href="/admin/inventory" className="btn btnPrimary">
          Manage Inventory
        </Link>

        {/* future links */}
        {/* <Link href="/admin/orders">Orders</Link> */}
      </div>
    </div>
  );
}
