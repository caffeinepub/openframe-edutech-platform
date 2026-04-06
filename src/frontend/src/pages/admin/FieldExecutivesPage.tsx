import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Edit,
  Loader2,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { db } from "../../lib/storage";
import type { FieldExecutive } from "../../types/models";

export default function FieldExecutivesPage() {
  const [fes, setFEs] = useState<FieldExecutive[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editFE, setEditFE] = useState<FieldExecutive | null>(null);
  const [deleteFE, setDeleteFE] = useState<FieldExecutive | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const load = () => setFEs(db.getFEs());
  useEffect(load, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const allFEs = db.getFEs();

    if (editFE) {
      const updated = allFEs.map((fe) =>
        fe.id === editFE.id
          ? { ...fe, name: form.name.trim(), phone: form.phone.trim() }
          : fe,
      );
      db.saveFEs(updated);
      toast.success("Field Executive updated");
    } else {
      const nextNum = allFEs.length + 1;
      const feCode = `FE${String(nextNum).padStart(3, "0")}`;
      const newFE: FieldExecutive = {
        id: db.nextId(allFEs),
        feCode,
        name: form.name.trim(),
        phone: form.phone.trim(),
        principal: "",
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      db.saveFEs([...allFEs, newFE]);
      toast.success(`Field Executive ${feCode} created!`);
    }

    load();
    setShowAdd(false);
    setEditFE(null);
    setForm({ name: "", phone: "" });
    setLoading(false);
  };

  const handleDelete = () => {
    if (!deleteFE) return;
    const allFEs = db.getFEs().filter((fe) => fe.id !== deleteFE.id);
    db.saveFEs(allFEs);
    load();
    setDeleteFE(null);
    toast.success("Field Executive removed");
  };

  const openEdit = (fe: FieldExecutive) => {
    setEditFE(fe);
    setForm({ name: fe.name, phone: fe.phone });
    setShowAdd(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Field Executives
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {fes.length} total executives
          </p>
        </div>
        <Button
          onClick={() => {
            setEditFE(null);
            setForm({ name: "", phone: "" });
            setShowAdd(true);
          }}
          className="teal-gradient text-white border-0 gap-2"
          data-ocid="admin.add_fe.button"
        >
          <Plus className="h-4 w-4" />
          Add FE
        </Button>
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
            title="No field executives found"
            description={
              search
                ? "Try adjusting your search"
                : "Add your first FE to get started"
            }
            icon={Users}
            action={
              !search ? (
                <Button
                  onClick={() => setShowAdd(true)}
                  className="teal-gradient text-white border-0"
                  data-ocid="admin.fe.empty_state"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add FE
                </Button>
              ) : undefined
            }
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
                    Paid
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Joined
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((fe, idx) => (
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
                    <td className="p-4 text-center text-green-700 font-medium">
                      {getPaidCount(fe.id)}
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
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(fe)}
                          data-ocid={`admin.fe.edit_button.${idx + 1}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteFE(fe)}
                          data-ocid={`admin.fe.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAdd}
        onOpenChange={(o) => {
          setShowAdd(o);
          if (!o) {
            setEditFE(null);
            setForm({ name: "", phone: "" });
          }
        }}
      >
        <DialogContent data-ocid="admin.fe.dialog">
          <DialogHeader>
            <DialogTitle>
              {editFE ? "Edit Field Executive" : "Add New Field Executive"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="fe-name">Full Name *</Label>
                <Input
                  id="fe-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Enter full name"
                  className="mt-1"
                  data-ocid="admin.fe_name.input"
                />
              </div>
              <div>
                <Label htmlFor="fe-phone">Phone Number *</Label>
                <Input
                  id="fe-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="10-digit phone"
                  className="mt-1"
                  maxLength={10}
                  data-ocid="admin.fe_phone.input"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAdd(false);
                  setEditFE(null);
                }}
                data-ocid="admin.fe.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="teal-gradient text-white border-0"
                disabled={loading}
                data-ocid="admin.fe.save_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editFE ? (
                  "Save Changes"
                ) : (
                  "Add FE"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteFE}
        onOpenChange={(o) => !o && setDeleteFE(null)}
      >
        <AlertDialogContent data-ocid="admin.fe_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Field Executive?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteFE?.name}</strong>{" "}
              ({deleteFE?.feCode})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.fe_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.fe_delete.confirm_button"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
