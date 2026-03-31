import { NextRequest, NextResponse } from "next/server";
import { prebookRate } from "@/lib/liteapi/hotels";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId is required" },
        { status: 400 }
      );
    }

    const result = await prebookRate({ offerId });
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/prebook]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
