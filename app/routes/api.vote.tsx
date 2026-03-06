import { type ActionFunctionArgs, data } from "react-router";
import { prisma } from "~/lib/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json() as { itemId: string };
  const { itemId } = body;

  if (!itemId) {
    return data({ error: "itemId is required" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session_id=([^;]+)/);
  const sessionId = match ? match[1] : crypto.randomUUID();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return data({ error: "Item not found" }, { status: 404 });
  }

  try {
    await prisma.vote.create({ data: { itemId, sessionId } });
  } catch {
    // Already voted
  }

  const updatedItem = await prisma.item.findUnique({
    where: { id: itemId },
    include: { _count: { select: { votes: true } } },
  });

  return data({ success: true, voteCount: updatedItem?._count.votes ?? 0 });
}
