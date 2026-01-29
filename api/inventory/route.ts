import { NextResponse } from "next/server";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

// Configure Amplify ONCE for this route
Amplify.configure(outputs, { ssr: true });

// 👇 Force Identity Pool (guest) auth for public reads
const client = generateClient<Schema>({
  authMode: "identityPool",
});

export async function GET() {
  try {
    const { data, errors } = await client.models.InventoryItem.list();

    if (errors?.length) {
      console.error("❌ Inventory query errors:", errors);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("❌ Inventory API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}




