import { NextRequest, NextResponse } from "next/server";
import { bookFlight } from "@/lib/farenexus/book";

const REQUIRED_PAX_FIELDS = [
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "email",
  "phone",
] as const;

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { bookKey, passengers, agencyEmailAddress } = body as {
      bookKey?: string;
      passengers?: Record<string, unknown>[];
      agencyEmailAddress?: string;
    };

    if (!bookKey) {
      return NextResponse.json(
        { error: "bookKey is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        { error: "At least one passenger is required" },
        { status: 400 }
      );
    }

    for (const [i, p] of passengers.entries()) {
      for (const field of REQUIRED_PAX_FIELDS) {
        if (!p[field] || typeof p[field] !== "string") {
          return NextResponse.json(
            { error: `Passenger ${i + 1}: ${field} is required` },
            { status: 400 }
          );
        }
      }
    }

    const result = await bookFlight({
      bookKey,
      passengers: passengers as unknown as {
        firstName: string;
        lastName: string;
        gender: "M" | "F";
        dateOfBirth: string;
        email: string;
        phone: string;
      }[],
      agencyEmailAddress: agencyEmailAddress as string | undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/farenexus/book]", err);
    return NextResponse.json(
      { error: "Unable to complete flight booking" },
      { status: 500 }
    );
  }
}
