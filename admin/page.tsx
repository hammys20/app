"use client";

import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData, remove } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

const client = generateClient<Schema>();
type Item = Schema["InventoryItem"]["type"];

function parseTags(raw: unknown): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const tags = raw
    .split(/[|,]/g)
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

function toNumber(raw: unknown): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function isAdmin(groups?: string[]) {
  return (groups ?? []).includes("Admin");
}

export default function AdminPage() {
  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <Authenticator>
          {({ signOut }) => <AdminInner signOut={signOut} />}
        </Authenticator>
      </div>
    </div>
  );
}

function AdminInner({ signOut }: { signOut?: () => void }) {
  const [groups, setGroups] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);

  // form
  const [name, setName] = useState("");
  const [setNameField, setSetNameField] = useState("");
  const [number, setNumberField] = useState("");
  const [condition, setConditionField] = useState("");
  const [price, setPriceField] = useState("");
  const [tags, setTagsField] = useState("");
  const [description, setDescriptionField] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // csv
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const session = await fetchAuthSession();
      const g =
        (session.tokens?.accessToken?.payload["cognito:groups"] as string[]) ??
        [];
      setGroups(g);

      const res = await client.models.InventoryItem.list();
      setItems(res.data);
    })();
  }, []);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name ?? "");
    setSetNameField(editing.set ?? "");
    setNumberField(editing.number ?? "");
    setConditionField(editing.condition ?? "");
    setPriceField(typeof editing.price === "number" ? String(editing.price) : "");
    setTagsField((editing.tags ?? []).join(", "));
    setDescriptionField(editing.description ?? "");
    setFile(null);
  }, [editing]);

  async function refresh() {
    const res = await client.models.InventoryItem.list();
    setItems(res.data);
  }

  async function save() {
    if (!name.trim()) return alert("Name is required.");

    // upload new image (optional)
    let imageKey: string | undefined = editing?.imageKey ?? undefined;

    if (file) {
      const key = `cards/${crypto.randomUUID()}-${file.name}`;
      await uploadData({ path: key, data: file }).result;
      imageKey = key;

      // delete old image if replaced
      if (editing?.imageKey && editing.imageKey !== key) {
        try {
          await remove({ path: editing.imageKey });
        } catch {}
      }
    }

    const priceNum = price.trim() ? Number(price) : undefined;
    if (price.trim() && !Number.isFinite(priceNum)) return alert("Price must be a number.");

    const tagArr = parseTags(tags) ?? undefined;

    if (editing) {
      await client.models.InventoryItem.update({
        id: editing.id,
        name: name.trim(),
        set: setNameField.trim() || undefined,
        number: number.trim() || undefined,
        condition: condition.trim() || undefined,
        price: typeof priceNum === "number" ? priceNum : undefined,
        tags: tagArr,
        description: description.trim() || undefined,
        imageKey,
      });
      setEditing(null);
    } else {
      await client.models.InventoryItem.create({
        name: name.trim(),
        set: setNameField.trim() || undefined,
        number: number.trim() || undefined,
        condition: condition.trim() || undefined,
        price: typeof priceNum === "number" ? priceNum : undefined,
        tags: tagArr,
        description: description.trim() || undefined,
        imageKey,
      });
    }

    // clear form
    setName("");
    setSetNameField("");
    setNumberField("");
    setConditionField("");
    setPriceField("");
    setTagsField("");
    setDescriptionField("");
    setFile(null);

    await refresh();
  }

  async function del(it: Item) {
    if (!confirm(`Delete: ${it.name}?`)) return;

    await client.models.InventoryItem.delete({ id: it.id });
    if (it.imageKey) {
      try {
        await remove({ path: it.imageKey });
      } catch {}
    }
    await refresh();
  }

  async function runCsvImport() {
    if (!csvFile) return alert("Choose a CSV file first.");
    setCsvStatus("Parsing CSV…");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, unknown>[];

          // Expected headers:
          // name,set,number,condition,price,tags,description
          const creates = rows
            .map((r) => ({
              name: String(r.name ?? "").trim(),
              set: String(r.set ?? "").trim() || undefined,
              number: String(r.number ?? "").trim() || undefined,
              condition: String(r.condition ?? "").trim() || undefined,
              price: toNumber(r.price),
              tags: parseTags(r.tags),
              description: String(r.description ?? "").trim() || undefined,
            }))
            .filter((r) => r.name);

          if (!creates.length) {
            setCsvStatus("No valid rows found (need at least a 'name' column).");
            return;
          }

          setCsvStatus(`Importing ${creates.length} items…`);

          // Import sequentially (safe + avoids throttling)
          let ok = 0;
          for (const c of creates) {
            await client.models.InventoryItem.create(c);
            ok++;
            if (ok % 25 === 0) setCsvStatus(`Imported ${ok}/${creates.length}…`);
          }

          setCsvStatus(`✅ Imported ${ok} items.`);
          setCsvFile(null);
          await refresh();
        } catch (e: any) {
          setCsvStatus(`❌ Import failed: ${e?.message ?? String(e)}`);
        }
      },
      error: (err) => {
        setCsvStatus(`❌ CSV parse error: ${err.message}`);
      },
    });
  }

  if (!isAdmin(groups)) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>Admin</h1>
        <p style={{ color: "var(--muted)" }}>
          You’re signed in, but not in the <b>Admin</b> group.
        </p>
        <button className="btn" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Admin Inventory</h1>
        <button className="btn" onClick={signOut}>
          Sign out
        </button>
      </div>

      {/* CSV Import */}
      <div className="card" style={{ padding: 14, marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>CSV Bulk Import</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
          CSV headers: <b>name,set,number,condition,price,tags,description</b> (tags can be comma or pipe separated)
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
          />
          <button className="btn btnPrimary" onClick={runCsvImport}>
            Import CSV
          </button>
          {csvStatus ? <span style={{ color: "var(--muted)", fontSize: 13 }}>{csvStatus}</span> : null}
        </div>
      </div>

      {/* Editor + List */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        {/* Editor */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>
            {editing ? `Edit: ${editing.name}` : "Create item"}
          </div>

          <Field label="Name" value={name} onChange={setName} />
          <Field label="Set" value={setNameField} onChange={setSetNameField} />
          <Field label="Number" value={number} onChange={setNumberField} />
          <Field label="Condition" value={condition} onChange={setConditionField} />
          <Field label="Price" value={price} onChange={setPriceField} type="number" />
          <Field label="Tags (comma or | separated)" value={tags} onChange={setTagsField} />
          <Field label="Description" value={description} onChange={setDescriptionField} textarea />

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Image</div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn btnPrimary" onClick={save}>
              {editing ? "Save changes" : "Create"}
            </button>
            {editing ? (
              <button className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Items ({items.length})</div>

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  background: "var(--surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    {(it.set ?? "—")}
                    {it.number ? ` • ${it.number}` : ""}
                    {it.condition ? ` • ${it.condition}` : ""}
                    {typeof it.price === "number" ? ` • $${it.price}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn" onClick={() => setEditing(it)}>
                    Edit
                  </button>
                  <button className="btn" onClick={() => del(it)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      {textarea ? (
        <textarea
          className="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          className="input"
          value={value}
          type={type ?? "text"}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
