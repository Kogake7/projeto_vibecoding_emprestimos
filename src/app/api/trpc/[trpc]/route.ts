import { createTRPCHandler } from "../../../../server/api/handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handler = createTRPCHandler();
export { handler as GET, handler as POST };
