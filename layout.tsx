import "./globals.css";
import { AmplifyProvider } from "./providers/AmplifyProvider";
import HeaderClient from "../components/HeaderClient";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
