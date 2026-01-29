import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

// Public reads for item pages (no login)
const client = generateClient<Schema>({ authMode: "apiKey" });

type Item = {
  id: string;
  name: string;
  price?: number;
  status?: string;
  image?: string;
  description?: string;
};

function money(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await client.models.InventoryItem.get({ id });
  const item = res.data as unknown as Item | null;

  if (!item) return notFound();

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto" }}>
      <Link href="/inventory" className="btn">
        ← Back to Inventory
      </Link>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <Image
            src={item.image || "/cards/placeholder.png"}
            alt={item.name}
            width={900}
            height={1200}
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>

        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900 }}>{item.name}</h1>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <div style={{ opacity: 0.85 }}>
              <strong>Price:</strong> {money(item.price)}
            </div>
            <div style={{ opacity: 0.85 }}>
              <strong>Status:</strong> {item.status ?? "—"}
            </div>
          </div>

          {item.description && (
            <div style={{ marginTop: 18, opacity: 0.85, lineHeight: 1.6 }}>
              {item.description}
            </div>
          )}

          <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              className="btn btnPrimary"
              href="https://www.whatnot.com/s/UlNKtYo1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy live on Whatnot
            </Link>

            <Link href="/inventory" className="btn">
              Browse more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
