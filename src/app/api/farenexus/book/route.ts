import { NextRequest, NextResponse } from "next/server";
import { bookFlight } from "@/lib/farenexus/book";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { bookKey, passengers, agencyEmailAddress } = body;

    if (!bookKey) {
      return NextResponse.json(
        { error: "bookKey is required" },
        { status: 400 }
      );
    }

    if (!passengers?.length) {
      return NextResponse.json(
        { error: "At least one passenger is required" },
        { status: 400 }
      );
    }

    const result = await bookFlight({
      bookKey,
      passengers,
      agencyEmailAddress,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/farenexus/book]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
