"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export default function AdminPage() {
  const [items, setItems] = useState<Schema["InventoryItem"]["type"][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.models.InventoryItem.list()
      .then(({ data }) => {
        setItems(data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p style={{ color: "var(--muted)" }}>Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Admin Inventory</h1>

      {items.length === 0 && (
        <p style={{ color: "var(--muted)" }}>No inventory items found.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ padding: 16 }}>
            <strong>{item.name}</strong>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Status: {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
