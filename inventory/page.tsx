"use client";

import inventory from "@/data/inventory.json";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  set?: string;
  number?: string;
  condition?: string;
  price?: number;
  image?: string;
  tags?: string[];
  status?: "available" | "reserved" | "sold";
};

function money(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function norm(s?: string) {
  return (s ?? "").toLowerCase().trim();
}

/* ✅ FIXED Buy Now */
async function buyNow(itemId: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Checkout error:", err);
    alert("This item is currently unavailable. Please refresh.");
    return;
  }

  const data = await res.json();
  if (data?.url) {
    window.location.href = data.url;
  }
}

export default function InventoryPage() {
  const items = inventory as Item[];

  /* ---------- Filters ---------- */

  const sets = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => it.set && s.add(it.set));
    return Array.from(s).sort();
  }, [items]);

  const conditions = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => it.condition && s.add(it.condition));
    return Array.from(s).sort();
  }, [items]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => (it.tags ?? []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  const priceStats = useMemo(() => {
    const prices = items
      .map((it) => it.price)
      .filter((p): p is number => typeof p === "number");
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  const [q, setQ] = useState("");
  const [setFilter, setSetFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [minPrice, setMinPrice] = useState(priceStats.min);
  const [maxPrice, setMaxPrice] = useState(priceStats.max);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const query = norm(q);

    return items.filter((it) => {
      const haystack = [
        it.name,
        it.set,
        it.number,
        it.condition,
        ...(it.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (setFilter !== "all" && it.set !== setFilter) return false;
      if (conditionFilter !== "all" && it.condition !== conditionFilter)
        return false;

      const p = it.price;
      if (typeof p === "number") {
        if (p < minPrice || p > maxPrice) return false;
      }

      if (selectedTags.length) {
        const tags = new Set((it.tags ?? []).map((t) => t.toLowerCase()));
        for (const t of selectedTags) {
          if (!tags.has(t.toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [
    items,
    q,
    setFilter,
    conditionFilter,
    minPrice,
    maxPrice,
    selectedTags,
  ]);

  /* ---------- UI ---------- */

  return (
    <div className="container">
      <h1 style={{ marginBottom: 12 }}>Inventory</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((it) => {
          const unavailable = it.status === "sold" || it.status === "reserved";

          return (
            <Link
              key={it.id}
              href={`/item/${it.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                position: "relative",
                opacity: it.status === "sold" ? 0.6 : 1,
              }}
            >
              <div className="card cardHover">
                {it.status === "sold" && (
                  <div className="badge badgeSold">SOLD</div>
                )}
                {it.status === "reserved" && (
                  <div className="badge badgeReserved">RESERVED</div>
                )}

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "3 / 4",
                    background: "#0f1115",
                  }}
                >
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        color: "var(--muted)",
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>

                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 900 }}>{it.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    {it.set}
                    {it.number && ` • ${it.number}`}
                    {it.condition && ` • ${it.condition}`}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        color: "var(--accent)",
                      }}
                    >
                      {money(it.price)}
                    </div>

                    {!unavailable && (
                      <button
                        className="btn btnPrimary"
                        onClick={(e) => {
                          e.preventDefault();
                          buyNow(it.id);
                        }}
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ marginTop: 16, color: "var(--muted)" }}>
          No matching items.
        </div>
      )}
    </div>
  );
}
