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
  status?: "available" | "reserved" | "sold";
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

  const items = inventory as Item[];
  const item = items.find((x) => x.id === id);

  if (!item) return notFound();

  const isSold = item.status === "sold";
  const isReserved = item.status === "reserved";

  return (
    <div className="container" style={{ maxWidth: 1000 }}>
      <Link
        href="/inventory"
        className="btn"
        style={{
          textDecoration: "none",
          width: "fit-content",
          marginBottom: 14,
        }}
      >
        ← Back to Inventory
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 420px) 1fr",
          gap: 18,
        }}
      >
        {/* Image */}
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3/4",
              background: "rgba(15,23,42,0.04)",
              filter: isSold ? "grayscale(0.15)" : "none",
              opacity: isSold ? 0.85 : 1,
            }}
          >
            {isSold ? (
              <div className="badge badgeSold">SOLD</div>
            ) : isReserved ? (
              <div className="badge badgeReserved">RESERVED</div>
            ) : null}

            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="420px"
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
        </div>

        {/* Details */}
        <div>
          <h1 style={{ margin: 0, fontSize: 34, letterSpacing: -0.3 }}>
            {item.name}
          </h1>

          <div style={{ marginTop: 10, color: "var(--muted)", lineHeight: 1.7 }}>
            <div>
              Set: <b style={{ color: "var(--text)" }}>{item.set ?? "—"}</b>
            </div>
            <div>
              No:{" "}
              <b style={{ color: "var(--text)" }}>{item.number ?? "—"}</b>
            </div>
            <div>
              Condition:{" "}
              <b style={{ color: "var(--text)" }}>{item.condition ?? "—"}</b>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 28,
              fontWeight: 900,
              color: "var(--accent)",
            }}
          >
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
                    border: "1px solid rgba(184,134,11,0.35)",
                    background: "rgba(184,134,11,0.08)",
                    color: "var(--accent)",
                    fontWeight: 800,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {item.description ? (
            <div className="card" style={{ padding: 14, marginTop: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Notes</div>
              <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                {item.description}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
