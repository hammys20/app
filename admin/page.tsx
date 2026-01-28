"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export default function AdminPage() {
  const [items, setItems] = useState<Schema["InventoryItem"]["type"][]>([]);

  useEffect(() => {
    client.models.InventoryItem.list().then(({ data }) => setItems(data));
  }, []);

  async function updateStatus(id: string, status: string) {
    await client.models.InventoryItem.update({ id, status });
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  }

  return (
    <div className="container">
      <h1>Admin Inventory</h1>

      {items.map((item) => (
        <div key={item.id} className="card" style={{ marginBottom: 12 }}>
          <b>{item.name}</b> — {item.status}

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {["available", "reserved", "sold"].map((s) => (
              <button
                key={s}
                className="btn"
                onClick={() => updateStatus(item.id, s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
