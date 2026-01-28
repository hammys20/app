import "./globals.css";
import Header from "./components/Header";
import { AmplifyProvider } from "./amplify-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AmplifyProvider>
          <Header />
          <main className="container">{children}</main>
        </AmplifyProvider>
      </body>
    </html>
  );
}
