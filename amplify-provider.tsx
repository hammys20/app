"use client";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { useEffect } from "react";

export function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // ✅ Runs ONLY in browser
    Amplify.configure(outputs);
  }, []);

  return <>{children}</>;
}

