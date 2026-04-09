import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Phone,
  UserCheck2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../../lib/storage";
import type { TeamLeader } from "../../types/models";

const COMMISSION_RATE = 10;
const POLL_INTERVAL_MS = 5000;

// ---- helpers ----
interface ToastMsg {
  id: number;
  text: string;
}

interface EditForm {
  name: string;
  phone: string;
  monthlyTarget: string;
  commissionRate: string;
  status: "active" | "inactive";
}

// ---- Edit Modal ----
interface EditModalProps {
  tl: TeamLeader & { commissionRate?: number; status?: "active" | "inactive" };
  onSave: (
    updated: TeamLeader & {
      commissionRate: number;
      status: "active" | "inactive";
    },
  ) => void;
  onClose: () => void;
}

function EditModal({ tl, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<EditForm>({
    name: tl.name,
    phone: tl.phone,
    monthlyTarget: String(tl.monthlyTarget),
    commissionRate: String(tl.commissionRate ?? COMMISSION_RATE),
    status: tl.status ?? "active",
  });
  const [errors, setErrors] = useState<Partial<EditForm>>({});

  function validate(): boolean {
    const next: Partial<EditForm> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone.trim()))
      next.phone = "Enter a valid 10-digit phone";
    const mt = Number(form.monthlyTarget);
    if (Number.isNaN(mt) || mt < 0) next.monthlyTarget = "Enter a valid target";
    const cr = Number(form.commissionRate);
    if (Number.isNaN(cr) || cr < 0)
      next.commissionRate = "Enter a valid commission rate";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      ...tl,
      name: form.name.trim(),
      phone: form.phone.trim(),
      monthlyTarget: Number(form.monthlyTarget),
      commissionRate: Number(form.commissionRate),
      status: form.status,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      data-ocid="admin.tl_edit_modal.overlay"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
          data-ocid="admin.tl_edit_modal.close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Edit Team Leader
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update details for{" "}
            <span className="font-semibold text-foreground">{tl.name}</span>
          </p>
        </div>

        {/* Referral code — read-only */}
        <div className="bg-muted/40 border border-border rounded-lg px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Referral Code
          </span>
          <span className="font-mono text-sm font-bold text-foreground">
            {tl.referralCode}
          </span>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label
              htmlFor="tl-name"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              Name
            </Label>
            <Input
              id="tl-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              data-ocid="admin.tl_edit_modal.name_input"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="tl-phone"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              Phone
            </Label>
            <Input
              id="tl-phone"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="10-digit phone number"
              data-ocid="admin.tl_edit_modal.phone_input"
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="tl-target"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Monthly Target
              </Label>
              <Input
                id="tl-target"
                type="number"
                min={0}
                value={form.monthlyTarget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthlyTarget: e.target.value }))
                }
                placeholder="500"
                data-ocid="admin.tl_edit_modal.target_input"
              />
              {errors.monthlyTarget && (
                <p className="text-xs text-red-500">{errors.monthlyTarget}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="tl-commission"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Commission (₹/reg)
              </Label>
              <Input
                id="tl-commission"
                type="number"
                min={0}
                value={form.commissionRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, commissionRate: e.target.value }))
                }
                placeholder="10"
                data-ocid="admin.tl_edit_modal.commission_input"
              />
              {errors.commissionRate && (
                <p className="text-xs text-red-500">{errors.commissionRate}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </Label>
            <div className="flex gap-3">
              {(["active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    form.status === s
                      ? s === "active"
                        ? "bg-green-100 border-green-400 text-green-800"
                        : "bg-red-100 border-red-400 text-red-800"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                  data-ocid={`admin.tl_edit_modal.status_${s}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      s === "active" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="admin.tl_edit_modal.cancel"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
            onClick={handleSave}
            data-ocid="admin.tl_edit_modal.save_btn"
          >
            <UserCheck2 className="h-4 w-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Extended TL type with admin-editable fields ----
type TLRecord = TeamLeader & {
  commissionRate: number;
  status: "active" | "inactive";
};

function normalizeTL(tl: TeamLeader): TLRecord {
  const raw = tl as unknown as Record<string, unknown>;
  return {
    ...tl,
    commissionRate:
      typeof raw.commissionRate === "number"
        ? raw.commissionRate
        : COMMISSION_RATE,
    status: raw.status === "inactive" ? "inactive" : "active",
  };
}

export default function TeamLeadersPage() {
  const [tls, setTLs] = useState<TLRecord[]>([]);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<TLRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  const loadData = useCallback(() => {
    setTLs(db.getTeamLeaders().map(normalizeTL));
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

  function handleSave(updated: TLRecord) {
    const all = db.getTeamLeaders();
    const next = all.map((t) => (t.id === updated.id ? updated : t));
    db.saveTeamLeaders(next);
    addToast(`${updated.name} updated successfully`);
    setEditTarget(null);
    loadData();
  }

  const filtered = tls.filter(
    (tl) =>
      tl.name.toLowerCase().includes(search.toLowerCase()) ||
      tl.phone.includes(search) ||
      tl.referralCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Leaders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {tls.length} registered team leaders — TLs self-register via the TL
          login page
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total TLs
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tls.length}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {tls.filter((t) => t.status === "active").length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck2 className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total FEs
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {tls.reduce((sum, t) => sum + t.assignedFEIds.length, 0)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total Commission
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ₹
            {tls
              .reduce((sum, t) => sum + t.totalCommission, 0)
              .toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name, phone, or referral code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        data-ocid="admin.tl_search.input"
      />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-foreground">
                No team leaders yet
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {search
                  ? "Try adjusting your search"
                  : "Team Leaders register themselves via the TL login page"}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="admin.tl.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    TL ID
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Name
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Phone
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Referral Code
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Assigned FEs
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Monthly Target
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Commission Rate
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Total Commission
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Joined
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tl, idx) => (
                  <tr
                    key={tl.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                    data-ocid={`admin.tl.item.${idx + 1}`}
                  >
                    <td className="p-4">
                      <span className="font-mono font-semibold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                        {tl.id}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {tl.name}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {tl.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs bg-muted/50 border border-border px-2 py-0.5 rounded text-foreground">
                        {tl.referralCode}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-foreground">
                        {tl.assignedFEIds.length}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {tl.monthlyTarget.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-green-700 font-semibold">
                        ₹{tl.commissionRate}/reg
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-green-700 font-semibold">
                        ₹{tl.totalCommission.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(tl.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      {tl.status === "active" ? (
                        <Badge className="bg-green-100 text-green-700 border border-green-300 font-semibold text-xs px-2.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1.5" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border border-red-300 font-semibold text-xs px-2.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-1.5" />
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/40 text-primary hover:bg-primary/5 hover:border-primary text-xs h-7 px-3"
                        onClick={() => setEditTarget(tl)}
                        data-ocid={`admin.tl.edit_btn.${tl.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          tl={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Toast notifications */}
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
