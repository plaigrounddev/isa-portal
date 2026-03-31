import { NextRequest, NextResponse } from "next/server";
import { bookRate } from "@/lib/liteapi/hotels";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { prebookId, guestInfo, payment } = body as {
      prebookId?: string;
      guestInfo?: { firstName?: string; lastName?: string; email?: string };
      payment?: { method: string };
    };

    if (!prebookId || typeof prebookId !== "string") {
      return NextResponse.json(
        { error: "prebookId is required" },
        { status: 400 }
      );
    }

    if (
      !guestInfo ||
      !guestInfo.firstName?.trim() ||
      !guestInfo.lastName?.trim() ||
      !guestInfo.email?.trim()
    ) {
      return NextResponse.json(
        { error: "guestInfo with firstName, lastName, and email is required" },
        { status: 400 }
      );
    }

    const result = await bookRate({
      prebookId,
      guestInfo: {
        firstName: guestInfo.firstName.trim(),
        lastName: guestInfo.lastName.trim(),
        email: guestInfo.email.trim(),
      },
      payment: payment ?? { method: "ACC_CREDIT_CARD" },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/hotels/book]", err);
    return NextResponse.json(
      { error: "Unable to complete hotel booking" },
      { status: 500 }
    );
  }
}
