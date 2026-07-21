import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { pollAll } from "@/lib/status/poll";

export const dynamic = "force-dynamic";

/** Polls every project's status endpoint. Callable by a cron (guard with CRON_SECRET) or on-demand. */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await pollAll(new URL(req.url).origin);
  revalidatePath("/");
  return NextResponse.json({ polled: results.length, results });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
