"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// 🔒 configure ONCE at module load
Amplify.configure(outputs, { ssr: true });

export function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
