"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listInventoryAdmin,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/lib/data/inventory";

type Item = {
  id: string;
  name: string;
  price?: number;
  status?: string;
  image?: string;
  description?: string;
};

const STATUSES = ["Available", "Pending", "Sold"] as const;

function money(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{
    name: string;
    price: string;
    status: (typeof STATUSES)[number];
    image: string;
    description: string;
  }>({
    name: "",
    price: "",
    status: "Available",
    image: "",
    description: "",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listInventoryAdmin();
      setItems((data as unknown as Item[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter && (i.status ?? "") !== statusFilter) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [items, search, statusFilter]);

  async function saveItem(id: string, updates: Partial<Item>) {
    setSavingId(id);
    setError(null);

    // Optimistic update
    const prev = items;
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...updates } : i)));

    try {
      await updateInventoryItem(id, updates as any);
    } catch (e: any) {
      setItems(prev);
      setError(e?.message ?? "Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate() {
    setCreateError(null);

    if (!newItem.name.trim()) {
      setCreateError("Name is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await createInventoryItem({
        name: newItem.name.trim(),
        price: newItem.price ? Number(newItem.price) : undefined,
        status: newItem.status,
        image: newItem.image.trim() || undefined,
        description: newItem.description.trim() || undefined,
      });

      if (created) {
        setItems((cur) => [created as unknown as Item, ...cur]);
      }

      setShowAdd(false);
      setNewItem({
        name: "",
        price: "",
        status: "Available",
        image: "",
        description: "",
      });
    } catch (e: any) {
      setCreateError(e?.message ?? "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this item? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== id));

    try {
      await deleteInventoryItem(id);
    } catch (e: any) {
      setItems(prev);
      setError(e?.message ?? "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Inventory Admin</h1>
          <p style={{ opacity: 0.7 }}>Admin-only inventory management</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={refresh} disabled={loading}>
            Refresh
          </button>
          <button className="btn btnPrimary" onClick={() => setShowAdd(true)}>
            + Add Item
          </button>
        </div>
      </div>

      {/* Controls */}
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

      {/* Errors */}
      {(error || createError) && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid rgba(255,0,0,0.3)",
            background: "rgba(255,0,0,0.08)",
          }}
        >
          {error ?? createError}
        </div>
      )}

      {/* List */}
      <div style={{ marginTop: 24 }}>
        {loading && <div style={{ opacity: 0.6 }}>Loading inventory…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ opacity: 0.6 }}>No inventory found.</div>
        )}

        {filtered.map((item) => {
          const saving = savingId === item.id;
          const deleting = deletingId === item.id;

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 2fr 140px",
                gap: 12,
                padding: 14,
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                opacity: deleting ? 0.5 : 1,
              }}
            >
              {/* Name */}
              <input
                className="input"
                value={item.name}
                disabled={saving || deleting}
                onChange={(e) =>
                  setItems((cur) =>
                    cur.map((i) =>
                      i.id === item.id ? { ...i, name: e.target.value } : i
                    )
                  )
                }
                onBlur={(e) =>
                  saveItem(item.id, { name: e.target.value.trim() })
                }
              />

              {/* Price */}
              <input
                type="number"
                className="input"
                value={item.price ?? ""}
                disabled={saving || deleting}
                onChange={(e) => {
                  const v = e.target.value;
                  setItems((cur) =>
                    cur.map((i) =>
                      i.id === item.id
                        ? { ...i, price: v === "" ? undefined : Number(v) }
                        : i
                    )
                  );
                }}
                onBlur={(e) =>
                  saveItem(item.id, {
                    price: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />

              {/* Status buttons */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`btn ${item.status === s ? "btnPrimary" : ""}`}
                    disabled={saving || deleting}
                    onClick={() => saveItem(item.id, { status: s })}
                  >
                    {s}
                  </button>
                ))}

                <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 6 }}>
                  {saving ? "Saving…" : money(item.price)}
                </span>
              </div>

              {/* Actions */}
              <button
                className="btn"
                disabled={saving || deleting}
                onClick={() => handleDelete(item.id)}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => !creating && setShowAdd(false)}
        >
          <div
            style={{
              width: 520,
              maxWidth: "100%",
              background: "var(--panel, rgba(20,22,26,1))",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Add Item</h2>
              <button className="btn" disabled={creating} onClick={() => setShowAdd(false)}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Name (required)"
                value={newItem.name}
                onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
              />

              <input
                className="input"
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
              />

              <select
                className="input"
                value={newItem.status}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, status: e.target.value as any }))
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="Image URL (optional)"
                value={newItem.image}
                onChange={(e) => setNewItem((v) => ({ ...v, image: e.target.value }))}
              />

              <textarea
                className="input"
                placeholder="Description (optional)"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, description: e.target.value }))
                }
                style={{ minHeight: 90 }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn" disabled={creating} onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button
                  className="btn btnPrimary"
                  disabled={creating || !newItem.name.trim()}
                  onClick={handleCreate}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>

            {createError && (
              <div style={{ marginTop: 12, opacity: 0.85 }}>❌ {createError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
