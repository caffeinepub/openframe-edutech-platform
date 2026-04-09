import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Phone,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { assignFEToTL, db, getUnassignedFEs } from "../../lib/storage";
import type { FieldExecutive, TeamLeader } from "../../types/models";

const MIN_ACTIVE_STUDENTS = 20;
const COMMISSION_RATE = 10;
const POLL_INTERVAL_MS = 5000;

// ---- helpers ----
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// ---- Assignment Modal ----
interface AssignModalProps {
  feIds: number[];
  feNames: string[];
  tls: TeamLeader[];
  onAssign: (tlId: string, tlName: string) => Promise<void>;
  onClose: () => void;
}

function AssignModal({
  feIds,
  feNames,
  tls,
  onAssign,
  onClose,
}: AssignModalProps) {
  const [selectedTL, setSelectedTL] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const selectedTLObj = tls.find((t) => t.id === selectedTL);
  const label =
    feIds.length === 1 ? feNames[0] : `${feIds.length} selected FEs`;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAssign() {
    if (!selectedTL || !selectedTLObj) return;
    setIsLoading(true);
    await onAssign(selectedTL, selectedTLObj.name);
    setIsLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      data-ocid="admin.assign_modal.overlay"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
          data-ocid="admin.assign_modal.close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Assign Team Leader
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a Team Leader to assign to{" "}
            <span className="font-semibold text-foreground">{label}</span>
          </p>
        </div>

        {/* TL Dropdown */}
        <div className="space-y-1.5">
          <label
            htmlFor="tl-select"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            Team Leader
          </label>
          <div className="relative" ref={dropRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 border border-input rounded-lg bg-background text-sm text-foreground hover:border-primary transition-colors"
              data-ocid="admin.assign_modal.tl_select"
            >
              <span
                className={
                  selectedTLObj ? "text-foreground" : "text-muted-foreground"
                }
              >
                {selectedTLObj
                  ? `${selectedTLObj.name} — ${selectedTLObj.referralCode}`
                  : "Choose a Team Leader..."}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {open && (
              <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {tls.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No Team Leaders registered yet.
                  </div>
                ) : (
                  tls.map((tl) => (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTL(tl.id);
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
                      data-ocid={`admin.assign_modal.tl_option.${tl.id}`}
                    >
                      <span className="font-medium text-foreground">
                        {tl.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {tl.referralCode}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
            data-ocid="admin.assign_modal.cancel"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
            disabled={!selectedTL || isLoading}
            onClick={handleAssign}
            data-ocid="admin.assign_modal.assign_btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Assigning…
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-1.5" /> Assign
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Toast notification ----
interface ToastMsg {
  id: number;
  text: string;
}

export default function FieldExecutivesPage() {
  const [fes, setFEs] = useState<FieldExecutive[]>([]);
  const [unassigned, setUnassigned] = useState<FieldExecutive[]>([]);
  const [tls, setTLs] = useState<TeamLeader[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modalTarget, setModalTarget] = useState<FieldExecutive[] | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  const loadData = useCallback(() => {
    setFEs(db.getFEs());
    setUnassigned(getUnassignedFEs());
    setTLs(db.getTeamLeaders());
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  function addToast(text: string) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000,
    );
  }

  // ---- unassigned section helpers ----
  function toggleSelect(feId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(feId) ? next.delete(feId) : next.add(feId);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === unassigned.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unassigned.map((fe) => fe.id)));
    }
  }

  function openSingle(fe: FieldExecutive) {
    setModalTarget([fe]);
  }

  function openBulk() {
    const targets = unassigned.filter((fe) => selected.has(fe.id));
    if (targets.length > 0) setModalTarget(targets);
  }

  async function handleAssign(tlId: string, tlName: string) {
    if (!modalTarget) return;
    for (const fe of modalTarget) {
      assignFEToTL(String(fe.id), tlId);
    }
    const names =
      modalTarget.length === 1
        ? modalTarget[0].name
        : `${modalTarget.length} Field Executives`;
    addToast(`${names} assigned to ${tlName}`);
    setModalTarget(null);
    setSelected(new Set());
    loadData();
  }

  // ---- existing table helpers ----
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

  const allChecked =
    unassigned.length > 0 && selected.size === unassigned.length;
  const someChecked = selected.size > 0 && selected.size < unassigned.length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Field Executives</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {fes.length} registered executives — FEs self-register via the login
          page
        </p>
      </div>

      {/* ================================================================
          SECTION 1: Unassigned Field Executives
      ================================================================ */}
      <section className="space-y-3" data-ocid="admin.unassigned_fe.section">
        {/* Section heading */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-500" />
            Unassigned Field Executives
          </h2>
          {unassigned.length > 0 ? (
            <Badge className="bg-amber-100 text-amber-700 border border-amber-300 font-semibold text-xs px-2 py-0.5">
              {unassigned.length} Pending
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700 border border-green-300 font-semibold text-xs px-2 py-0.5">
              All Assigned ✓
            </Badge>
          )}
          {selected.size > 0 && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white border-0 ml-auto"
              onClick={openBulk}
              data-ocid="admin.unassigned_fe.bulk_assign_btn"
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Bulk Assign ({selected.size})
            </Button>
          )}
        </div>

        {unassigned.length === 0 ? (
          /* All assigned — green success card */
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">
              All Field Executives are assigned to Team Leaders ✓
            </p>
          </div>
        ) : (
          /* Unassigned table */
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="admin.unassigned_fe.table"
              >
                <thead>
                  <tr className="border-b border-border bg-red-50/60">
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked;
                        }}
                        onChange={toggleAll}
                        className="rounded border-border cursor-pointer"
                        aria-label="Select all unassigned FEs"
                        data-ocid="admin.unassigned_fe.select_all"
                      />
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">
                      Name
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">
                      Phone
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">
                      Last Login
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((fe, idx) => (
                    <tr
                      key={fe.id}
                      className={`border-b border-border last:border-0 transition-colors ${
                        selected.has(fe.id)
                          ? "bg-amber-50/60"
                          : "hover:bg-muted/20"
                      }`}
                      data-ocid={`admin.unassigned_fe.item.${idx + 1}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(fe.id)}
                          onChange={() => toggleSelect(fe.id)}
                          className="rounded border-border cursor-pointer"
                          aria-label={`Select ${fe.name}`}
                          data-ocid={`admin.unassigned_fe.checkbox.${fe.id}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">
                          {fe.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {fe.feCode}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Phone className="h-3 w-3 shrink-0" />
                          {fe.phone}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {timeAgo(fe.lastLoginDate)}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5">
                          <UserX className="h-3 w-3" />
                          Unassigned
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500 text-xs h-7 px-3"
                          onClick={() => openSingle(fe)}
                          data-ocid={`admin.unassigned_fe.assign_btn.${fe.id}`}
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Assign TL
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          SECTION 2: All Field Executives (existing — unchanged)
      ================================================================ */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          All Field Executives
        </h2>

        <Input
          placeholder="Search by name, FE code, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          data-ocid="admin.fe_search.input"
        />

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
                            {new Date(fe.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {fe.status === "unassigned" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5">
                              <UserX className="h-3 w-3" />
                              Unassigned
                            </span>
                          ) : (
                            <StatusBadge
                              status={fe.isActive ? "Active" : "Inactive"}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          Assignment Modal
      ================================================================ */}
      {modalTarget && (
        <AssignModal
          feIds={modalTarget.map((fe) => fe.id)}
          feNames={modalTarget.map((fe) => fe.name)}
          tls={tls}
          onAssign={handleAssign}
          onClose={() => setModalTarget(null)}
        />
      )}

      {/* ================================================================
          Toast notifications
      ================================================================ */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
