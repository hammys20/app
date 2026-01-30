"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
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

function safeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Add modal image file
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const [newItem, setNewItem] = useState<{
    name: string;
    price: string;
    status: (typeof STATUSES)[number];
    image: string; // optional manual URL override
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
    let cancelled = false;

    async function boot() {
      // Wait for tokens to exist (avoids “refresh after login”)
      for (let i = 0; i < 20; i++) {
        try {
          const session = await fetchAuthSession();
          const hasTokens =
            !!session.tokens?.accessToken && !!session.tokens?.idToken;
          if (hasTokens) break;
        } catch {
          // ignore and retry briefly
        }
        await new Promise((r) => setTimeout(r, 150));
      }

      if (!cancelled) {
        await refresh();
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
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
      await updateInventoryItem({ id, ...(updates as any) });
}     catch (e: any)  {
      setItems(prev);
      setError(e?.message ?? "Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  }

  async function uploadItemImage(itemId: string, file: File) {
    setUploadingId(itemId);
    setError(null);

    try {
      const key = `cards/${itemId}/${Date.now()}_${safeFileName(file.name)}`;

      await uploadData({
        path: key,
        data: file,
        options: {
          contentType: file.type || "image/jpeg",
        },
      }).result;

      const urlRes = await getUrl({ path: key });
      const url = urlRes.url.toString();

      // Save URL into model
      await updateInventoryItem({ id: itemId, image: url } as any);

      // Update UI
      setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, image: url } : i)));
    } catch (e: any) {
      setError(e?.message ?? "Image upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  async function removeItemImage(itemId: string) {
    setUploadingId(itemId);
    setError(null);

    const current = items.find((x) => x.id === itemId);
    const url = current?.image;

    try {
      // Best-effort delete from storage if the URL points to our "cards/" path.
      // If parsing fails, we still clear the DB field.
      if (url && url.includes("/cards/")) {
        const idx = url.indexOf("/cards/");
        const pathPart = url.substring(idx + 1); // remove leading "/"
        // pathPart is "cards/...."
        await remove({ path: pathPart });
      }

      await updateInventoryItem({ id: itemId, image: undefined } as any);
      setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, image: undefined } : i)));
    } catch (e: any) {
      setError(e?.message ?? "Remove image failed.");
    } finally {
      setUploadingId(null);
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
        image: newItem.image.trim() || undefined, // optional manual URL
        description: newItem.description.trim() || undefined,
      });

      if (created) {
        const createdItem = created as unknown as Item;

        // If user selected a file, upload it and save URL
        if (newImageFile) {
          await uploadItemImage(createdItem.id, newImageFile);
          // uploadItemImage already updates UI state for image field
        }

        // Put new item at top (ensure we reflect the latest image value if upload succeeded)
        setItems((cur) => {
          const existing = cur.filter((x) => x.id !== createdItem.id);
          const newest = items.find((x) => x.id === createdItem.id) ?? createdItem;
          return [newest, ...existing];
        });
      }

      setShowAdd(false);
      setNewItem({
        name: "",
        price: "",
        status: "Available",
        image: "",
        description: "",
      });
      setNewImageFile(null);
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
          const uploading = uploadingId === item.id;

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "72px 2fr 1fr 2fr 180px",
                gap: 12,
                padding: 14,
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                opacity: deleting ? 0.5 : 1,
              }}
            >
              {/* Image */}
              <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      border: "1px dashed var(--border)",
                      opacity: 0.6,
                    }}
                  />
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <label
                    className="btn"
                    style={{
                      cursor: saving || deleting || uploading ? "not-allowed" : "pointer",
                      padding: "6px 10px",
                      fontSize: 12,
                      opacity: saving || deleting || uploading ? 0.6 : 1,
                    }}
                  >
                    {uploading ? "..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={saving || deleting || uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        uploadItemImage(item.id, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <button
                    className="btn"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                    disabled={!item.image || saving || deleting || uploading}
                    onClick={() => removeItemImage(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Name */}
              <input
                className="input"
                value={item.name}
                disabled={saving || deleting || uploading}
                onChange={(e) =>
                  setItems((cur) =>
                    cur.map((i) =>
                      i.id === item.id ? { ...i, name: e.target.value } : i
                    )
                  )
                }
                onBlur={(e) => saveItem(item.id, { name: e.target.value.trim() })}
              />

              {/* Price */}
              <input
                type="number"
                className="input"
                value={item.price ?? ""}
                disabled={saving || deleting || uploading}
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
                    price:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />

              {/* Status buttons */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`btn ${item.status === s ? "btnPrimary" : ""}`}
                    disabled={saving || deleting || uploading}
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
                disabled={saving || deleting || uploading}
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
              <button
                className="btn"
                disabled={creating}
                onClick={() => setShowAdd(false)}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Name (required)"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, name: e.target.value }))
                }
              />

              <input
                className="input"
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, price: e.target.value }))
                }
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

              {/* File upload (recommended) */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                  Image upload (recommended)
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <label className="btn" style={{ cursor: creating ? "not-allowed" : "pointer" }}>
                    Choose file
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={creating}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setNewImageFile(f);
                      }}
                    />
                  </label>

                  <div style={{ fontSize: 12, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {newImageFile ? newImageFile.name : "No file selected"}
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  (Optional) Or paste an image URL below.
                </div>
              </div>

              {/* Optional manual URL */}
              <input
                className="input"
                placeholder="Image URL (optional)"
                value={newItem.image}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, image: e.target.value }))
                }
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
                <button
                  className="btn"
                  disabled={creating}
                  onClick={() => setShowAdd(false)}
                >
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
