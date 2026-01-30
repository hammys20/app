"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import BuyNowButton from "@/components/BuyNowButton";
import { client } from "@/lib/data";

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

export default function ItemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? String(params.id) : "";

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;

      setLoading(true);
      const res = await client.models.InventoryItem.get({ id });

      if (!cancelled) {
        setItem((res.data as unknown as Item) ?? null);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isAvailable = useMemo(() => {
    return (item?.status ?? "").trim().toLowerCase() === "available";
  }, [item?.status]);

  const canBuy = useMemo(() => {
    return isAvailable && typeof item?.price === "number" && item.price > 0;
  }, [isAvailable, item?.price]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "40px auto", opacity: 0.7 }}>
        Loading item…
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ maxWidth: 1000, margin: "40px auto" }}>
        <Link href="/inventory" className="btn">
          ← Back to Inventory
        </Link>
        <div style={{ marginTop: 18, opacity: 0.7 }}>Item not found.</div>
      </div>
    );
  }

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

          {/* BUY NOW / OUT OF STOCK */}
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {canBuy ? (
              <div style={{ maxWidth: 360 }}>
                <BuyNowButton itemId={item.id} />
              </div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.04)",
                    opacity: 0.8,
                    fontWeight: 700,
                  }}
                >
                  {isAvailable ? "Unavailable" : "Out of stock"}
                </div>
                {isAvailable && typeof item.price !== "number" ? (
                  <span style={{ fontSize: 12, opacity: 0.65 }}>
                    Missing price — add a price in Admin
                  </span>
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.65 }}>
                    {isAvailable ? "Check back soon" : "Check back soon"}
                  </span>
                )}
              </div>
            )}

            <span style={{ fontSize: 12, opacity: 0.65 }}>
              {canBuy ? "Ships fast • Secure packaging" : "Check back soon"}
            </span>
          </div>

          {item.description && (
            <div style={{ marginTop: 18, opacity: 0.85, lineHeight: 1.6 }}>
              {item.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

