import { NextRequest, NextResponse } from "next/server";
import { reviewFlight } from "@/lib/farenexus/review";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { reviewKey } = body;

    if (!reviewKey) {
      return NextResponse.json(
        { error: "reviewKey is required" },
        { status: 400 }
      );
    }

    const result = await reviewFlight(reviewKey);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/farenexus/review]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
