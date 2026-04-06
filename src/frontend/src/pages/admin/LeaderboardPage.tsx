import { Badge } from "@/components/ui/badge";
import { Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "../../lib/storage";
import type { FieldExecutive } from "../../types/models";

type Period = "all" | "week" | "month";

interface LeaderboardEntry {
  fe: FieldExecutive;
  total: number;
  paid: number;
  conversionRate: number;
  performanceScore: number;
}

function computeScore(
  total: number,
  conversionRate: number,
  workHours: number,
): number {
  return Math.min(
    100,
    Math.round(total * 40 + conversionRate * 0.4 + workHours * 2),
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    const fes = db.getFEs();
    let regs = db.getRegistrations();

    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      regs = regs.filter((r) => new Date(r.createdAt) >= weekAgo);
    } else if (period === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      regs = regs.filter((r) => new Date(r.createdAt) >= monthAgo);
    }

    const data: LeaderboardEntry[] = fes
      .map((fe) => {
        const feRegs = regs.filter((r) => r.feId === fe.id);
        const total = feRegs.length;
        const paid = feRegs.filter((r) => r.paymentStatus === "Paid").length;
        const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
        const performanceScore = computeScore(
          total,
          conversionRate,
          fe.totalWorkHours ?? 0,
        );
        return { fe, total, paid, conversionRate, performanceScore };
      })
      .sort(
        (a, b) =>
          b.performanceScore - a.performanceScore ||
          b.total - a.total ||
          b.paid - a.paid,
      );

    setEntries(data);
  }, [period]);

  const rankColors = [
    {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-400",
      icon: Trophy,
      label: "Gold",
    },
    {
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-400",
      icon: Medal,
      label: "Silver",
    },
    {
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-400",
      icon: Medal,
      label: "Bronze",
    },
  ];

  function getTierBadge(idx: number) {
    if (idx === 0)
      return (
        <Badge className="bg-yellow-400 text-white hover:bg-yellow-400 text-xs">
          <Trophy className="h-3 w-3 mr-1" /> Gold
        </Badge>
      );
    if (idx === 1)
      return (
        <Badge className="bg-gray-400 text-white hover:bg-gray-400 text-xs">
          <Medal className="h-3 w-3 mr-1" /> Silver
        </Badge>
      );
    if (idx === 2)
      return (
        <Badge className="bg-orange-500 text-white hover:bg-orange-500 text-xs">
          <Medal className="h-3 w-3 mr-1" /> Bronze
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-xs">
        #{idx + 1}
      </Badge>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            FE Performance Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ranked by performance score
          </p>
        </div>
        {/* Period Toggle */}
        <div className="flex gap-2">
          {(["all", "week", "month"] as Period[]).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-ocid={`admin.leaderboard.${p}.tab`}
            >
              {p === "all"
                ? "All Time"
                : p === "week"
                  ? "This Week"
                  : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.slice(0, 3).map((entry, idx) => {
            const colors = rankColors[idx];
            const Icon = colors.icon;
            return (
              <div
                key={entry.fe.id}
                className={`rounded-xl p-5 border-2 text-center ${colors.bg} ${colors.border}`}
                data-ocid={`admin.leaderboard.item.${idx + 1}`}
              >
                <div
                  className={`w-10 h-10 rounded-full ${colors.badge} flex items-center justify-center mx-auto mb-3`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  #{idx + 1} {colors.label}
                </p>
                <p className="font-bold text-foreground">{entry.fe.name}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {entry.fe.feCode}
                </p>
                <div className="text-center mb-2">
                  <p className="text-2xl font-bold text-foreground">
                    {entry.performanceScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {entry.total}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-700">
                      {entry.paid}
                    </p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">
                      {entry.conversionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Rate</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm" data-ocid="admin.leaderboard.table">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Rank",
                "Name",
                "FE Code",
                "Score",
                "Total Students",
                "Paid Students",
                "Conversion Rate",
                "Tier",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr
                key={entry.fe.id}
                className={`border-b border-border last:border-0 hover:bg-muted/20 ${
                  idx === 0 ? "bg-yellow-50/50" : ""
                }`}
                data-ocid={`admin.leaderboard.row.${idx + 1}`}
              >
                <td className="p-4">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${
                      idx === 0
                        ? "bg-yellow-400"
                        : idx === 1
                          ? "bg-gray-400"
                          : idx === 2
                            ? "bg-orange-400"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="p-4 font-medium text-foreground">
                  {entry.fe.name}
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {entry.fe.feCode}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-bold text-foreground">
                    {entry.performanceScore}
                  </span>
                </td>
                <td className="p-4 text-center font-semibold">{entry.total}</td>
                <td className="p-4 text-center font-semibold text-green-700">
                  {entry.paid}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full teal-gradient rounded-full"
                        style={{ width: `${entry.conversionRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10">
                      {entry.conversionRate}%
                    </span>
                  </div>
                </td>
                <td className="p-4">{getTierBadge(idx)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
