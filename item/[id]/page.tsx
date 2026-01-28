import inventory from "@/data/inventory.json";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Item = {
  id: string;
  name: string;
  set?: string;
  number?: string;
  condition?: string;
  price?: number;
  image?: string;
  tags?: string[];
  description?: string;
};

function money(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function ItemPage({ params }: { params: { id: string } }) {
  const items = inventory as Item[];
  const item = items.find((x) => x.id === params.id);

  if (!item) return notFound();

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Link
        href="/inventory"
        style={{
          display: "inline-block",
          color: "#FFD700",
          textDecoration: "none",
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        ← Back to Inventory
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 420px) 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "rgba(0,0,0,0.35)" }}>
            {item.image ? (
              <Image src={item.image} alt={item.name} fill sizes="420px" style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 0.6 }}>
                No image
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>{item.name}</h1>

          <div style={{ marginTop: 10, opacity: 0.8, lineHeight: 1.6 }}>
            <div>Set: <b>{item.set ?? "—"}</b></div>
            <div>No: <b>{item.number ?? "—"}</b></div>
            <div>Condition: <b>{item.condition ?? "—"}</b></div>
          </div>

          <div style={{ marginTop: 16, fontSize: 26, fontWeight: 900, color: "#FFD700" }}>
            {money(item.price)}
          </div>

          {item.tags?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {item.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,215,0,0.25)",
                    color: "#FFD700",
                    opacity: 0.95,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {item.description ? (
            <p style={{ marginTop: 16, opacity: 0.85, lineHeight: 1.6 }}>{item.description}</p>
          ) : null}

          <div style={{ marginTop: 18, opacity: 0.75 }}>
            (Next step: add Stripe “Buy Now” here.)
          </div>
        </div>
      </div>
    </div>
  );
}

