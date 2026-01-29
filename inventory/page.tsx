"use client";

import { listInventoryPublic } from "@/lib/data/inventory";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  name: string;
  price?: number;
  status?: string;
  image?: string;
};

const STATUSES = ["Available", "Pending", "Sold"];

function money(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    listInventoryPublic()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [items, search, statusFilter]);

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Inventory</h1>
          <p style={{ opacity: 0.7 }}>Browse available cards</p>
        </div>

        <Link className="btn" href="https://www.whatnot.com/s/UlNKtYo1" target="_blank">
          Live on Whatnot
        </Link>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <input
          placeholder="Search inventory…"
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input"
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 24 }}>
        {loading && <div style={{ opacity: 0.6 }}>Loading inventory…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ opacity: 0.6 }}>No inventory found.</div>
        )}

        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 120px",
              gap: 12,
              padding: 14,
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <strong>{item.name}</strong>
            <span style={{ opacity: 0.8 }}>{money(item.price)}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{item.status ?? "—"}</span>

            <Link href={`/item/${item.id}`} className="btn">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
