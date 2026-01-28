import type { Metadata } from "next";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Hammy’s Trading",
  description: "Trading card storefront",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <Header />
        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}

