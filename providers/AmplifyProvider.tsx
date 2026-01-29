"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useEffect } from "react";

let configured = false;

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!configured) {
      Amplify.configure(outputs, { ssr: true });
      configured = true;
    }
  }, []);

  return <>{children}</>;
}
