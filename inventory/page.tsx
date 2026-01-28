import inventory from "@/data/inventory.json";
import Image from "next/image";
import Link from "next/link";
import useSWR from 'swr';

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

export default function InventoryPage() {
  const items = inventory as Item[];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.5 }}>Inventory</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>{items.length} items</div>
        </div>

        <Link
          href="/"
          style={{
            color: "#FFD700",
            textDecoration: "none",
            fontWeight: 700,
            border: "1px solid rgba(255,215,0,0.35)",
            padding: "10px 12px",
            borderRadius: 12,
          }}
        >
          Back
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {items.map((it) => (
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
              <div style={{ fontWeight: 800, letterSpacing: 0.2, marginBottom: 6 }}>{it.name}</div>
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
    </div>
  );
}


