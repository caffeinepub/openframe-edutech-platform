import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  UserCheck2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createTeamLeader, db } from "../../lib/storage";
import { formatCurrency } from "../../lib/utils";
import type { TeamLeader } from "../../types/models";

const COMMISSION_RATE = 10;
const POLL_INTERVAL_MS = 5000;

// ---- helpers ----
interface ToastMsg {
  id: number;
  text: string;
  type: "success" | "error";
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
  tl: TLRecord;
  onSave: (updated: TLRecord) => void;
  onClose: () => void;
}

function EditModal({ tl, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<EditForm>({
    name: tl.name,
    phone: tl.phone,
    monthlyTarget: String(tl.monthlyTarget),
    commissionRate: String(tl.commissionRate),
    status: tl.status,
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
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
          data-ocid="admin.tl_edit_modal.close"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-foreground">
            Edit Team Leader
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update details for{" "}
            <span className="font-semibold text-foreground">{tl.name}</span>
          </p>
        </div>

        <div className="bg-muted/40 border border-border rounded-lg px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Referral Code
          </span>
          <span className="font-mono text-sm font-bold text-foreground">
            {tl.referralCode}
          </span>
        </div>

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
                    className={`w-2 h-2 rounded-full ${s === "active" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

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

// ---- New TL Modal ----
interface NewTLFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  commissionRate: string;
  monthlyTarget: string;
  joiningDate: string;
  status: "active" | "inactive";
}

interface NewTLModalProps {
  onCreated: (tl: TeamLeader) => void;
  onClose: () => void;
  onAssignFEs: (tlId: string) => void;
  allTLs: TLRecord[];
}

function NewTLModal({
  onCreated,
  onClose,
  onAssignFEs,
  allTLs,
}: NewTLModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<NewTLFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    commissionRate: String(COMMISSION_RATE),
    monthlyTarget: "500",
    joiningDate: todayStr,
    status: "active",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewTLFormData, string>>
  >({});
  const [createdTL, setCreatedTL] = useState<TeamLeader | null>(null);

  function validate(): boolean {
    const next: Partial<Record<keyof NewTLFormData, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone.trim()))
      next.phone = "Enter a valid 10-digit phone";
    const cr = Number(form.commissionRate);
    if (Number.isNaN(cr) || cr < 0) next.commissionRate = "Enter a valid rate";
    const mt = Number(form.monthlyTarget);
    if (Number.isNaN(mt) || mt < 0) next.monthlyTarget = "Enter a valid target";
    if (!form.joiningDate) next.joiningDate = "Joining date is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const result = createTeamLeader({
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      commissionRate: Number(form.commissionRate),
      monthlyTarget: Number(form.monthlyTarget),
      joiningDate: form.joiningDate,
      status: form.status,
    });
    if (!result) {
      setErrors((prev) => ({
        ...prev,
        phone: "This phone number is already registered",
      }));
      return;
    }
    setCreatedTL(result);
    onCreated(result);
  }

  function handleAddAnother() {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      commissionRate: String(COMMISSION_RATE),
      monthlyTarget: "500",
      joiningDate: todayStr,
      status: "active",
    });
    setErrors({});
    setCreatedTL(null);
  }

  const previewId = (() => {
    const nums = allTLs
      .map((tl) => Number.parseInt(tl.id.replace(/^TL0*/, ""), 10))
      .filter((n) => !Number.isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `TL${String(next).padStart(3, "0")}`;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.50)" }}
      data-ocid="admin.tl_new_modal.overlay"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg my-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                New Team Leader
              </h2>
              <p className="text-xs text-muted-foreground">
                Auto-assigned ID:{" "}
                <span className="font-mono font-bold text-primary">
                  {previewId}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
            data-ocid="admin.tl_new_modal.close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {createdTL ? (
          <div className="p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Team Leader Created Successfully!
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {createdTL.name} has been registered as a Team Leader
                </p>
              </div>
            </div>

            {/* Created TL info */}
            <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  TL ID
                </span>
                <span className="font-mono font-bold text-primary text-sm bg-primary/10 px-2.5 py-0.5 rounded">
                  {createdTL.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  Referral Code
                </span>
                <span className="font-mono font-bold text-foreground text-sm bg-muted/60 border border-border px-2.5 py-0.5 rounded">
                  {createdTL.referralCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  Commission Rate
                </span>
                <span className="font-semibold text-green-700 text-sm">
                  {formatCurrency(createdTL.commissionRate)}/reg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  Monthly Target
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {createdTL.monthlyTarget.toLocaleString("en-IN")}{" "}
                  registrations
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 gap-2.5">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 w-full"
                onClick={() => {
                  onAssignFEs(createdTL.id);
                  onClose();
                }}
                data-ocid="admin.tl_new_modal.assign_fe_btn"
              >
                <UserCheck2 className="h-4 w-4 mr-2" />
                Assign Field Executives
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
                data-ocid="admin.tl_new_modal.view_profile_btn"
              >
                <Users className="h-4 w-4 mr-2" />
                View TL Profile
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/5"
                onClick={handleAddAnother}
                data-ocid="admin.tl_new_modal.add_another_btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another TL
              </Button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div className="p-6 space-y-4">
            {/* Required fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="new-tl-name"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-tl-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Rajesh Kumar"
                  data-ocid="admin.tl_new_modal.name_input"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="new-tl-phone"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="new-tl-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="10-digit number"
                    className="pl-9"
                    data-ocid="admin.tl_new_modal.phone_input"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Optional fields */}
            <div className="space-y-1">
              <Label
                htmlFor="new-tl-email"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Email{" "}
                <span className="text-muted-foreground/60 font-normal">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="new-tl-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                  className="pl-9"
                  data-ocid="admin.tl_new_modal.email_input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="new-tl-address"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Address{" "}
                <span className="text-muted-foreground/60 font-normal">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="new-tl-address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="City, State"
                  className="pl-9"
                  data-ocid="admin.tl_new_modal.address_input"
                />
              </div>
            </div>

            {/* Numeric config */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="new-tl-commission"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Commission (₹/reg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-tl-commission"
                  type="number"
                  min={0}
                  value={form.commissionRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, commissionRate: e.target.value }))
                  }
                  placeholder="10"
                  data-ocid="admin.tl_new_modal.commission_input"
                />
                {errors.commissionRate && (
                  <p className="text-xs text-red-500">
                    {errors.commissionRate}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="new-tl-target"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Monthly Target <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-tl-target"
                  type="number"
                  min={0}
                  value={form.monthlyTarget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, monthlyTarget: e.target.value }))
                  }
                  placeholder="500"
                  data-ocid="admin.tl_new_modal.target_input"
                />
                {errors.monthlyTarget && (
                  <p className="text-xs text-red-500">{errors.monthlyTarget}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <Label
                  htmlFor="new-tl-joining"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Joining Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="new-tl-joining"
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, joiningDate: e.target.value }))
                    }
                    className="pl-9"
                    data-ocid="admin.tl_new_modal.joining_date_input"
                  />
                </div>
                {errors.joiningDate && (
                  <p className="text-xs text-red-500">{errors.joiningDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </Label>
                <div className="flex gap-2">
                  {(["active", "inactive"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        form.status === s
                          ? s === "active"
                            ? "bg-green-100 border-green-400 text-green-800"
                            : "bg-red-100 border-red-400 text-red-800"
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      }`}
                      data-ocid={`admin.tl_new_modal.status_${s}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${s === "active" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                data-ocid="admin.tl_new_modal.cancel"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                onClick={handleSubmit}
                data-ocid="admin.tl_new_modal.create_btn"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Create Team Leader
              </Button>
            </div>
          </div>
        )}
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
    tlID: tl.tlID ?? tl.id,
    joiningDate:
      (tl.joiningDate as string | undefined) ?? tl.createdAt.split("T")[0],
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
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

  function addToast(text: string, type: ToastMsg["type"] = "success") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, text, type }]);
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

  function handleCreated(tl: TeamLeader) {
    loadData();
    addToast(`Team Leader ${tl.name} (${tl.id}) created successfully!`);
    setHighlightId(tl.id);
    setTimeout(() => setHighlightId(null), 4000);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Leaders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tls.length} registered team leaders
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 w-full sm:w-auto"
          onClick={() => setShowNewModal(true)}
          data-ocid="admin.tl.new_entry_btn"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Entry
        </Button>
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
            {formatCurrency(tls.reduce((sum, t) => sum + t.totalCommission, 0))}
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
                  : 'Click "+ New Entry" to create the first Team Leader'}
              </p>
            </div>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewModal(true)}
                className="mt-1"
                data-ocid="admin.tl.empty_new_entry_btn"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Entry
              </Button>
            )}
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
                    Team Size
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tl, idx) => (
                  <tr
                    key={tl.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      tl.id === highlightId
                        ? "bg-green-50 border-l-2 border-l-green-500"
                        : "hover:bg-muted/20"
                    }`}
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
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        / 20
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {tl.monthlyTarget.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-green-700 font-semibold">
                        {formatCurrency(tl.commissionRate)}/reg
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-green-700 font-semibold">
                        {formatCurrency(tl.totalCommission)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(
                          tl.joiningDate ?? tl.createdAt,
                        ).toLocaleDateString("en-IN", {
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
                      <div className="flex items-center justify-end gap-1.5">
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300/60 text-blue-600 hover:bg-blue-50 text-xs h-7 px-3"
                          onClick={() => setShowNewModal(false)}
                          data-ocid={`admin.tl.assign_btn.${tl.id}`}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Assign FE
                        </Button>
                      </div>
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

      {/* New TL Modal */}
      {showNewModal && (
        <NewTLModal
          onCreated={handleCreated}
          onClose={() => setShowNewModal(false)}
          onAssignFEs={() => setShowNewModal(false)}
          allTLs={tls}
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
            className={`pointer-events-auto flex items-center gap-2.5 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg ${
              t.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
