import { NextRequest, NextResponse } from "next/server";
import { bookRate } from "@/lib/liteapi/hotels";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prebookId, guestInfo, payment } = body;

    if (!prebookId || !guestInfo) {
      return NextResponse.json(
        { error: "prebookId and guestInfo are required" },
        { status: 400 }
      );
    }

    const result = await bookRate({
      prebookId,
      guestInfo,
      payment: payment ?? { method: "ACC_CREDIT_CARD" },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/book]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
