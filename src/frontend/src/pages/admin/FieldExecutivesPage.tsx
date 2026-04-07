import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { db } from "../../lib/storage";
import type { FieldExecutive } from "../../types/models";

const MIN_ACTIVE_STUDENTS = 20;
const COMMISSION_RATE = 10;

export default function FieldExecutivesPage() {
  const [fes, setFEs] = useState<FieldExecutive[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFEs(db.getFEs());
  }, []);

  const getStudentCount = (feId: number) =>
    db.getRegistrations().filter((r) => r.feId === feId).length;

  const getPaidCount = (feId: number) =>
    db
      .getRegistrations()
      .filter((r) => r.feId === feId && r.paymentStatus === "Paid").length;

  const filtered = fes.filter(
    (fe) =>
      fe.name.toLowerCase().includes(search.toLowerCase()) ||
      fe.feCode.toLowerCase().includes(search.toLowerCase()) ||
      fe.phone.includes(search),
  );

  function getPaidCountColor(count: number): string {
    if (count >= MIN_ACTIVE_STUDENTS) return "text-green-600 font-semibold";
    if (count >= 10) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Field Executives</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {fes.length} registered executives — FEs self-register via the login
          page
        </p>
      </div>

      <Input
        placeholder="Search by name, FE code, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        data-ocid="admin.fe_search.input"
      />

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No field executives yet"
            description={
              search
                ? "Try adjusting your search"
                : "Field Executives register themselves via the FE login page"
            }
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="admin.fe.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    FE ID
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Name
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Phone
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Students
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Paid Students
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Total Commission
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Joined
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((fe, idx) => {
                  const paidCount = getPaidCount(fe.id);
                  const commission = paidCount * COMMISSION_RATE;
                  return (
                    <tr
                      key={fe.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                      data-ocid={`admin.fe.item.${idx + 1}`}
                    >
                      <td className="p-4">
                        <span className="font-mono font-semibold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                          {fe.feCode}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">
                        {fe.name}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {fe.phone}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getStudentCount(fe.id)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={getPaidCountColor(paidCount)}>
                          {paidCount}
                        </span>
                        {paidCount < MIN_ACTIVE_STUDENTS && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (need {MIN_ACTIVE_STUDENTS - paidCount} more)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-green-700 font-semibold">
                          <span>{formatCurrency(commission)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {paidCount} paid
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(fe.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge
                          status={fe.isActive ? "Active" : "Inactive"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
