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
};

function money(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function norm(s?: string) {
  return (s ?? "").toLowerCase().trim();
}

export default function InventoryPage() {
  const items = inventory as Item[];

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

  // Keep price inputs valid if inventory changes
  // (tiny guard for dev/hot reload)
  useMemo(() => {
    setMinPrice((v) => (Number.isFinite(v) ? v : priceStats.min));
    setMaxPrice((v) => (Number.isFinite(v) ? v : priceStats.max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceStats.min, priceStats.max]);

  const filtered = useMemo(() => {
    const query = norm(q);

    return items.filter((it) => {
      // Search text across fields
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

      // Set filter
      if (setFilter !== "all" && it.set !== setFilter) return false;

      // Condition filter
      if (conditionFilter !== "all" && it.condition !== conditionFilter) return false;

      // Price range
      const p = typeof it.price === "number" ? it.price : undefined;
      if (typeof p === "number") {
        if (p < minPrice || p > maxPrice) return false;
      } else {
        // If no price, treat as not matching when user has narrowed range away from defaults
        // (keeps it intuitive)
        if (minPrice > priceStats.min || maxPrice < priceStats.max) return false;
      }

      // Tags (AND logic: item must contain all selected tags)
      if (selectedTags.length) {
        const tags = new Set((it.tags ?? []).map((t) => t.toLowerCase()));
        for (const t of selectedTags) {
          if (!tags.has(t.toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [items, q, setFilter, conditionFilter, minPrice, maxPrice, selectedTags, priceStats.min, priceStats.max]);

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

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.5 }}>Inventory</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            {filtered.length} of {items.length} items
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={clearFilters}
            style={{
              cursor: "pointer",
              background: "transparent",
              color: "#FFD700",
              border: "1px solid rgba(255,215,0,0.35)",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            Clear
          </button>

          <Link
            href="/"
            style={{
              color: "#FFD700",
              textDecoration: "none",
              fontWeight: 800,
              border: "1px solid rgba(255,215,0,0.35)",
              padding: "10px 12px",
              borderRadius: 12,
            }}
          >
            Back
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
        }}
      >
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
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
            }}
          />

          <select
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
            }}
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
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
            }}
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <div style={{ fontWeight: 800 }}>Price Range</div>
            <div style={{ opacity: 0.8 }}>
              {money(minPrice)} – {money(maxPrice)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              type="number"
              step="0.01"
              value={minPrice}
              min={priceStats.min}
              max={maxPrice}
              onChange={(e) => setMinPrice(Math.max(priceStats.min, Number(e.target.value)))}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.35)",
                color: "white",
                outline: "none",
              }}
              placeholder="Min"
            />
            <input
              type="number"
              step="0.01"
              value={maxPrice}
              min={minPrice}
              max={priceStats.max}
              onChange={(e) => setMaxPrice(Math.min(priceStats.max, Number(e.target.value)))}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.35)",
                color: "white",
                outline: "none",
              }}
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
                    style={{
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "8px 10px",
                      borderRadius: 999,
                      border: active
                        ? "1px solid rgba(255,215,0,0.85)"
                        : "1px solid rgba(255,215,0,0.25)",
                      background: active ? "rgba(255,215,0,0.12)" : "transparent",
                      color: "#FFD700",
                      fontWeight: 800,
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {selectedTags.length ? (
              <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
                Matching items must include <b>all</b> selected tags.
              </div>
            ) : null}
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
        {filtered.map((it) => (
          <Link
            key={it.id}
            href={`/item/${it.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", background: "rgba(0,0,0,0.35)" }}>
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 220px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 0.6 }}>
                  No image
                </div>
              )}
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 900, letterSpacing: 0.2, marginBottom: 6 }}>{it.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>
                {it.set ? it.set : "—"}
                {it.number ? ` • ${it.number}` : ""}
                {it.condition ? ` • ${it.condition}` : ""}
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 900, color: "#FFD700" }}>{money(it.price)}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>View</div>
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
                        border: "1px solid rgba(255,215,0,0.25)",
                        color: "#FFD700",
                        opacity: 0.9,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ marginTop: 16, opacity: 0.8 }}>
          No matches. Try clearing filters.
        </div>
      ) : null}
    </div>
  );
}
