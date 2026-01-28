import { NextResponse } from "next/server";
import { client } from "@/lib/data";

export async function GET() {
  try {
    const { data, errors } = await client.models.InventoryItem.list();

    if (errors) {
      console.error(errors);
      throw new Error("Inventory query failed");
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ Inventory API error:", err);
    return NextResponse.json(
      { error: "Failed to load inventory" },
      { status: 500 }
    );
  }
}
