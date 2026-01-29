import "./globals.css";
import HeaderClient from "@/components/HeaderClient";
import { AmplifyProvider } from "./amplify-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AmplifyProvider>
          <HeaderClient />
          <main className="container">{children}</main>
        </AmplifyProvider>
      </body>
    </html>
  );
}
