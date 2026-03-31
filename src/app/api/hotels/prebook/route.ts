import { NextRequest, NextResponse } from "next/server";
import { prebookRate } from "@/lib/liteapi/hotels";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { offerId } = body;

    if (!offerId || typeof offerId !== "string") {
      return NextResponse.json(
        { error: "offerId is required" },
        { status: 400 }
      );
    }

    const result = await prebookRate({ offerId });
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/prebook]", err);
    return NextResponse.json(
      { error: "Unable to prebook hotel rate" },
      { status: 500 }
    );
  }
}
