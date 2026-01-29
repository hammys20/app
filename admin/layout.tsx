"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        const session = await fetchAuthSession();
        const groups =
          (session.tokens?.accessToken?.payload["cognito:groups"] as string[]) || [];

        const isAdmin = Array.isArray(groups) && groups.includes("Admin");

        if (!mounted) return;

        if (!isAdmin) {
          router.replace("/"); // non-admins go home
          return;
        }

        setAllowed(true);
      } catch {
        // not signed in or no session
        router.replace("/signin?next=" + encodeURIComponent(pathname));
      } finally {
        if (mounted) setChecking(false);
      }
    }

    checkAdmin();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  if (checking) {
    return (
      <div style={{ maxWidth: 900, margin: "60px auto", opacity: 0.7 }}>
        Checking admin access…
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}

