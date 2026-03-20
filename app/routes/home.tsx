import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  data,
  redirect,
  useSubmit,
} from "react-router";
import { prisma } from "~/lib/db.server";
import type { Route } from "./+types/home";
import { useState } from "react";
import { CheckCircle, Sparkles, Trophy, Zap } from "lucide-react";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Pick One — 2択チャレンジ" },
    {
      name: "description",
      content: "2つのカードから1つを選んで投票しよう！あなたの選択が結果を左右する。",
    },
  ];
}

// Seed items if none exist
async function ensureItems() {
  const count = await prisma.item.count();
  if (count === 0) {
    await prisma.item.createMany({
      data: [
        {
          title: "🌊 海派",
          description: "波の音、潮風、青い水平線。海の無限の広がりに心が解き放たれる。",
          emoji: "🌊",
          color: "#0ea5e9",
        },
        {
          title: "🏔️ 山派",
          description: "静寂な森、清澄な空気、頂上からの絶景。山は魂を浄化してくれる。",
          emoji: "🏔️",
          color: "#10b981",
        },
      ],
    });
  }
}

function getSessionId(request: Request): string {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session_id=([^;]+)/);
  return match ? match[1] : crypto.randomUUID();
}

// Fallback items for when the database is unavailable
const FALLBACK_ITEMS = [
  {
    id: "fallback-1",
    title: "🌊 海派",
    description: "波の音、潮風、青い水平線。海の無限の広がりに心が解き放たれる。",
    emoji: "🌊",
    color: "#0ea5e9",
    voteCount: 0,
    percentage: 50,
  },
  {
    id: "fallback-2",
    title: "🏔️ 山派",
    description: "静寂な森、清澄な空気、頂上からの絶景。山は魂を浄化してくれる。",
    emoji: "🏔️",
    color: "#10b981",
    voteCount: 0,
    percentage: 50,
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = getSessionId(request);
  const isNewSession = !request.headers.get("Cookie")?.includes("session_id=");
  const headers: HeadersInit = isNewSession
    ? {
        "Set-Cookie": `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
      }
    : {};

  try {
    await ensureItems();

    const items = await prisma.item.findMany({
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: "asc" },
    });

    const existingVote = await prisma.vote.findFirst({ where: { sessionId } });
    const totalVotes = items.reduce((sum, item) => sum + item._count.votes, 0);

    return data(
      {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          emoji: item.emoji,
          color: item.color,
          voteCount: item._count.votes,
          percentage:
            totalVotes > 0
              ? Math.round((item._count.votes / totalVotes) * 100)
              : 50,
        })),
        votedItemId: existingVote?.itemId ?? null,
        totalVotes,
      },
      { headers }
    );
  } catch {
    // Database not available — return fallback data for UI preview
    return data(
      { items: FALLBACK_ITEMS, votedItemId: null, totalVotes: 0 },
      { headers }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const itemId = formData.get("itemId");

  if (typeof itemId !== "string") {
    return data({ error: "Invalid item" }, { status: 400 });
  }

  const sessionId = getSessionId(request);

  try {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return data({ error: "Item not found" }, { status: 404 });
    }

    await prisma.vote.create({ data: { itemId, sessionId } }).catch(() => {
      // Already voted (unique constraint), ignore
    });
  } catch {
    // Database unavailable — ignore
  }

  return redirect("/");
}

type ItemData = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  voteCount: number;
  percentage: number;
};

function PickCard({
  item,
  isVoted,
  hasVoted,
  onPick,
}: {
  item: ItemData;
  isVoted: boolean;
  hasVoted: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => !hasVoted && onPick(item.id)}
      disabled={hasVoted}
      className={[
        "group relative w-full rounded-3xl border-2 transition-all duration-500 overflow-hidden text-left",
        hasVoted
          ? isVoted
            ? "border-white/60 shadow-2xl scale-[1.02]"
            : "border-white/10 opacity-60"
          : "border-white/20 hover:border-white/60 hover:scale-[1.02] hover:shadow-2xl cursor-pointer",
      ].join(" ")}
      style={{
        background: hasVoted
          ? isVoted
            ? `linear-gradient(135deg, ${item.color}44, ${item.color}22)`
            : "rgba(255,255,255,0.03)"
          : `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
      }}
      type="button"
    >
      {/* Glow effect */}
      <div
        className={[
          "absolute inset-0 rounded-3xl transition-opacity duration-500 pointer-events-none",
          hasVoted
            ? isVoted
              ? "opacity-100"
              : "opacity-0"
            : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
        style={{ boxShadow: `inset 0 0 80px ${item.color}33` }}
      />

      <div className="relative p-8 md:p-10">
        {/* Emoji */}
        <div className="text-6xl md:text-7xl mb-6 transition-transform duration-300 group-hover:scale-110">
          {item.emoji}
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
          {item.title}
        </h2>

        {/* Description */}
        <p className="text-white/60 text-base md:text-lg leading-relaxed mb-6">
          {item.description}
        </p>

        {/* Vote result bar */}
        {hasVoted && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-semibold">
                {item.voteCount.toLocaleString()} 票
              </span>
              <span className="text-2xl font-black" style={{ color: item.color }}>
                {item.percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        )}

        {/* Selected badge */}
        {isVoted && (
          <div
            className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: item.color }}
          >
            <CheckCircle className="w-4 h-4" />
            あなたの選択
          </div>
        )}
      </div>
    </button>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { items, votedItemId, totalVotes } = loaderData;
  const [pending, setPending] = useState<string | null>(null);
  const hasVoted = votedItemId !== null;
  const submit = useSubmit();

  function handlePick(itemId: string) {
    if (hasVoted || pending) return;
    setPending(itemId);
    submit({ itemId }, { method: "post", action: "/" });
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #0f172a 50%, #0c1a10 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-indigo-600" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-emerald-600" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl bg-purple-500" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            あなたはどっち派？
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            Pick{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              One
            </span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl">
            2つのカードから1つを選んで投票しよう
          </p>
        </div>

        {/* Cards grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {items.map((item) => (
              <PickCard
                key={item.id}
                item={item}
                isVoted={votedItemId === item.id}
                hasVoted={hasVoted}
                onPick={handlePick}
              />
            ))}
          </div>

          {/* VS badge */}
          {!hasVoted && (
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black text-lg shadow-xl shadow-purple-500/30 border-2 border-white/20">
              VS
            </div>
          )}
        </div>

        {/* Result message */}
        {hasVoted && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">
                投票ありがとう！現在{" "}
                <span className="text-yellow-400 font-black">
                  {totalVotes.toLocaleString()}
                </span>{" "}
                人が投票中
              </span>
            </div>
          </div>
        )}

        {/* CTA prompt */}
        {!hasVoted && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 text-white/40 text-sm">
              <Zap className="w-4 h-4 text-yellow-500/60" />
              カードをクリックして投票
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-white/20 text-sm">
          pick-one — みんなの選択を可視化する
        </footer>
      </div>
    </main>
  );
}
