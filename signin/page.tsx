"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const session = await fetchAuthSession();
        const groups =
          session.tokens?.accessToken?.payload["cognito:groups"];

        if (Array.isArray(groups) && groups.includes("Admin")) {
          router.replace("/admin");
        }
      } catch {
        // user not signed in yet
      }
    }

    checkAdmin();
  }, [router]);

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <Authenticator />
    </div>
  );
}
