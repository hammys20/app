"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

async function fetchInventory(): Promise<Item[]> {
  const res = await fetch("/api/inventory", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load inventory");
  return res.json();
}

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
  if (data?.url) window.location.href = data.url;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory()
      .then(setItems)
      .catch((e) => {
        console.error(e);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // --- Build filter options from inventory ---
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
      .filter((p): p is number => typeof p === "number" && Number.isFinite(p));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [items]);

  // --- UI State ---
  const [q, setQ] = useState("");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<number>(priceStats.min);
  const [maxPrice, setMaxPrice] = useState<number>(priceStats.max);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Keep price inputs valid when items load
  useEffect(() => {
    setMinPrice(priceStats.min);
    setMaxPrice(priceStats.max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceStats.min, priceStats.max]);

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

      const p = typeof it.price === "number" ? it.price : undefined;
      if (typeof p === "number") {
        if (p < minPrice || p > maxPrice) return false;
      } else {
        if (minPrice > priceStats.min || maxPrice < priceStats.max) return false;
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
    priceStats.min,
    priceStats.max,
  ]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearFilters() {
    setQ("");
    setSetFilter("all");
    setConditionFilter("all");
    setMinPrice(priceStats.min);
    setMaxPrice(priceStats.max);
    setSelectedTags([]);
  }

  if (loading) {
    return (
      <div className="container">
        <p style={{ color: "var(--muted)" }}>Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.5 }}>
            Inventory
          </h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            {filtered.length} of {items.length} items
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={clearFilters}
            className="btn btnPrimary"
            style={{ textDecoration: "none" }}
          >
            Clear
          </button>

          <Link href="/" className="btn" style={{ textDecoration: "none" }}>
            Back
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 200px 200px",
            gap: 10,
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (name, set, number, tags)…"
            className="input"
          />

          <select
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Sets</option>
            {sets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Conditions</option>
            {conditions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 800 }}>Price Range</div>
            <div style={{ opacity: 0.8 }}>
              {money(minPrice)} – {money(maxPrice)}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <input
              type="number"
              step="0.01"
              value={minPrice}
              min={priceStats.min}
              max={maxPrice}
              onChange={(e) =>
                setMinPrice(
                  Math.max(priceStats.min, Number(e.target.value || 0))
                )
              }
              className="input"
              placeholder="Min"
            />
            <input
              type="number"
              step="0.01"
              value={maxPrice}
              min={minPrice}
              max={priceStats.max}
              onChange={(e) =>
                setMaxPrice(
                  Math.min(priceStats.max, Number(e.target.value || 0))
                )
              }
              className="input"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Tags */}
        {allTags.length ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allTags.map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className="btn"
                    style={{
                      borderColor: active
                        ? "rgba(184,134,11,0.75)"
                        : "rgba(184,134,11,0.25)",
                      background: active ? "rgba(184,134,11,0.12)" : "transparent",
                      color: "var(--accent)",
                      fontSize: 12,
                      borderRadius: 999,
                      padding: "8px 10px",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
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
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div className="card cardHover" style={{ position: "relative" }}>
                {it.status === "sold" ? (
                  <div className="badge badgeSold">SOLD</div>
                ) : it.status === "reserved" ? (
                  <div className="badge badgeReserved">RESERVED</div>
                ) : null}

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
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 220px"
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
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    {it.set ? it.set : "—"}
                    {it.number ? ` • ${it.number}` : ""}
                    {it.condition ? ` • ${it.condition}` : ""}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontWeight: 900, color: "var(--accent)" }}>
                      {money(it.price)}
                    </div>

                    {!unavailable ? (
                      <button
                        className="btn btnPrimary"
                        onClick={(e) => {
                          e.preventDefault();
                          buyNow(it.id);
                        }}
                      >
                        Buy Now
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        Unavailable
                      </span>
                    )}
                  </div>

                  {it.tags?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {it.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 999,
                            border: "1px solid rgba(184,134,11,0.25)",
                            color: "var(--accent)",
                            opacity: 0.9,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ marginTop: 16, color: "var(--muted)" }}>
          No matches. Try clearing filters.
        </div>
      ) : null}
    </div>
  );
}
