import { NextRequest, NextResponse } from "next/server";
import { reviewFlight } from "@/lib/farenexus/review";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { reviewKey } = body;

    if (!reviewKey || typeof reviewKey !== "string") {
      return NextResponse.json(
        { error: "reviewKey is required" },
        { status: 400 }
      );
    }

    const result = await reviewFlight(reviewKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/farenexus/review]", err);
    return NextResponse.json(
      { error: "Unable to review flight offer" },
      { status: 500 }
    );
  }
}
