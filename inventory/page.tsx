"use client";

import { listInventoryPublic } from "@/lib/data/inventory";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function statusStyle(status?: string) {
  if (status === "Available") {
    return { bg: "rgba(0,200,120,0.14)", fg: "#22c55e", border: "rgba(34,197,94,0.35)" };
  }
  if (status === "Pending") {
    return { bg: "rgba(255,180,0,0.14)", fg: "#f59e0b", border: "rgba(245,158,11,0.35)" };
  }
  if (status === "Sold") {
    return { bg: "rgba(255,80,80,0.12)", fg: "#ef4444", border: "rgba(239,68,68,0.35)" };
  }
  return { bg: "rgba(255,255,255,0.06)", fg: "rgba(255,255,255,0.75)", border: "rgba(255,255,255,0.12)" };
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    listInventoryPublic()
      .then((data) => setItems((data as unknown as Item[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter && (i.status ?? "") !== statusFilter) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Inventory</h1>
          <p style={{ opacity: 0.7 }}>Browse available cards</p>
        </div>

        <Link className="btn" href="https://www.whatnot.com/s/UlNKtYo1" target="_blank">
          Live on Whatnot
        </Link>
      </div>

      {/* CONTROLS */}
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

      {/* GRID */}
      <div style={{ marginTop: 24 }}>
        {loading && <div style={{ opacity: 0.6 }}>Loading inventory…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ opacity: 0.6 }}>No inventory found.</div>
        )}

        {!loading && filtered.length > 0 && (
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {filtered.map((item) => {
              const s = statusStyle(item.status);

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    overflow: "hidden",
                    borderRadius: 16,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      aspectRatio: "3 / 4",
                      background: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid var(--border)",
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ opacity: 0.55, fontSize: 13 }}>No image</div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: 14, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900, lineHeight: 1.2 }}>{item.name}</div>

                      <div
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: s.bg,
                          color: s.fg,
                          border: `1px solid ${s.border}`,
                          height: "fit-content",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.status ?? "—"}
                      </div>
                    </div>

                    <div style={{ fontSize: 14, opacity: 0.9 }}>{money(item.price)}</div>

                    {item.description && (
                      <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.45 }}>
                        {item.description.length > 120
                          ? item.description.slice(0, 120) + "…"
                          : item.description}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div style={{ padding: 14, paddingTop: 0 }}>
                    <Link
                      href={`/item/${item.id}`}
                      className="btn btnPrimary"
                      style={{ width: "100%", textAlign: "center" }}
                    >
                      View Item
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";

// import { listInventoryPublic } from "@/lib/data/inventory";
// import { useEffect, useMemo, useState } from "react";
// import Link from "next/link";

// type Item = {
//   id: string;
//   name: string;
//   price?: number;
//   status?: string;
//   image?: string;
// };

// const STATUSES = ["Available", "Pending", "Sold"];

// function money(n?: number) {
//   if (typeof n !== "number") return "—";
//   return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
// }

// export default function InventoryPage() {
//   const [items, setItems] = useState<Item[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);

//   useEffect(() => {
//     listInventoryPublic()
//       .then(setItems)
//       .finally(() => setLoading(false));
//   }, []);

//   const filtered = useMemo(() => {
//     return items.filter((i) => {
//       if (statusFilter && i.status !== statusFilter) return false;
//       if (search && !i.name.toLowerCase().includes(search.toLowerCase()))
//         return false;
//       return true;
//     });
//   }, [items, search, statusFilter]);

//   return (
//     <div style={{ maxWidth: 1200, margin: "40px auto" }}>
//       {/* HEADER */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "end",
//           gap: 16,
//         }}
//       >
//         <div>
//           <h1 style={{ fontSize: 28, fontWeight: 800 }}>Inventory</h1>
//           <p style={{ opacity: 0.7 }}>Browse available cards</p>
//         </div>

//         <Link className="btn" href="https://www.whatnot.com/s/UlNKtYo1" target="_blank">
//           Live on Whatnot
//         </Link>
//       </div>

//       {/* CONTROLS */}
//       <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
//         <input
//           placeholder="Search inventory…"
//           className="input"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         <select
//           className="input"
//           value={statusFilter ?? ""}
//           onChange={(e) => setStatusFilter(e.target.value || null)}
//         >
//           <option value="">All statuses</option>
//           {STATUSES.map((s) => (
//             <option key={s} value={s}>
//               {s}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* LIST */}
//       <div style={{ marginTop: 24 }}>
//         {loading && <div style={{ opacity: 0.6 }}>Loading inventory…</div>}

//         {!loading && filtered.length === 0 && (
//           <div style={{ opacity: 0.6 }}>No inventory found.</div>
//         )}

//         {filtered.map((item) => (
//           <div
//             key={item.id}
//             style={{
//               display: "grid",
//               gridTemplateColumns: "2fr 1fr 1fr 120px",
//               gap: 12,
//               padding: 14,
//               borderBottom: "1px solid var(--border)",
//               alignItems: "center",
//             }}
//           >
//             <strong>{item.name}</strong>
//             <span style={{ opacity: 0.8 }}>{money(item.price)}</span>
//             <span style={{ fontSize: 12, opacity: 0.7 }}>{item.status ?? "—"}</span>

//             <Link href={`/item/${item.id}`} className="btn">
//               View
//             </Link>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
