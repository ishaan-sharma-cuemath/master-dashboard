import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Reference implementation of the status contract every portal exposes at its own
 * `GET /api/status`. The Master Dashboard polls this and reflects it up. Only
 * `status` (health) is normalized across projects; everything else is source-defined.
 *
 * This example is a PIPELINE tracker (like the Visa Dashboard): report a plain
 * status line + a breakdown, NOT a fake linear percentage.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "warn", // pass | warn | fail  → green / amber / red
      statusLine: "34 granted · 3 rejected · 6 in progress (37 of 43 decided)",
      metric: { label: "Granted", value: 34, target: 43, unit: "people" },
      segments: [
        { label: "Granted", value: 34 },
        { label: "Rejected", value: 3 },
        { label: "In progress", value: 6 },
      ],
      updatedAt: new Date().toISOString(),
      serviceId: "example",
      version: "1",
    },
    { headers: { "content-type": "application/health+json" } },
  );
}
