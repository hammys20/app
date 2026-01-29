
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

function RedirectAfterSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthenticator((ctx) => [ctx.user]);

  useEffect(() => {
    if (!user) return;

    const next = searchParams.get("next") || "/admin/inventory";
    router.replace(next);
    router.refresh(); // ✅ forces App Router to re-render with new auth state
  }, [user, router, searchParams]);

  return null;
}

export default function SignInPage() {
  return (
    <div style={{ maxWidth: 520, margin: "60px auto" }}>
      <Authenticator>
        <RedirectAfterSignIn />
        <div style={{ marginTop: 14, opacity: 0.75 }}>
          Signing you in…
        </div>
      </Authenticator>
    </div>
  );
}


// "use client";

// import { Authenticator } from "@aws-amplify/ui-react";
// import "@aws-amplify/ui-react/styles.css";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";

// export default function SignInPage() {
//   const router = useRouter();

//   useEffect(() => {
//     async function checkAdmin() {
//       try {
//         const session = await fetchAuthSession();
//         const groups =
//           session.tokens?.accessToken?.payload["cognito:groups"];

//         if (Array.isArray(groups) && groups.includes("Admin")) {
//           router.replace("/admin");
//         }
//       } catch {
//         // user not signed in yet
//       }
//     }

//     checkAdmin();
//   }, [router]);

//   return (
//     <div style={{ maxWidth: 420, margin: "80px auto" }}>
//       <Authenticator />
//     </div>
//   );
// }
