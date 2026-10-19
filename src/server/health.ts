import { NextResponse } from "next/server";

type DatabaseCheck = () => Promise<unknown>;

export async function createHealthResponse(check: DatabaseCheck) {
  try {
    await check();
    return NextResponse.json({ status: "ok", database: "connected" } as const);
  } catch {
    return NextResponse.json(
      { status: "error", database: "unavailable" } as const,
      { status: 503 },
    );
  }
}
