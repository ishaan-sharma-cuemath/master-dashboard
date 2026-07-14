import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Reference implementation of the status contract every portal should expose at
 * its own `GET /api/status`. The Master Dashboard polls this shape and reflects
 * it up. Copy this into each portal (returning its real numbers).
 */
export function GET() {
  return NextResponse.json(
    {
      status: "warn", // pass | warn | fail  → green / amber / red
      progress: 62, // 0–100
      stage: "Consulate Interview", // current stage label
      summary: "Waiting on embassy slots for 3 applicants.", // one-line human status
      updatedAt: new Date().toISOString(), // when the portal computed this
      serviceId: "example",
      version: "1",
    },
    { headers: { "content-type": "application/health+json" } },
  );
}
