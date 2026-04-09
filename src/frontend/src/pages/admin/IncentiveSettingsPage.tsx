import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  IndianRupee,
  Info,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../../lib/storage";
import type { AdminConfig } from "../../types/models";

export default function IncentiveSettingsPage() {
  const [config, setConfig] = useState<AdminConfig>(() => db.getAdminConfig());
  const [inputRate, setInputRate] = useState<string>(
    String(config.feIncentiveRate),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = db.getAdminConfig();
    setConfig(loaded);
    setInputRate(String(loaded.feIncentiveRate));
  }, []);

  function handleSave() {
    const rate = Number(inputRate);
    if (!Number.isFinite(rate) || rate < 1 || rate > 1000) {
      toast.error("Incentive rate must be between ₹1 and ₹1,000");
      return;
    }
    const updated: AdminConfig = {
      ...config,
      feIncentiveRate: rate,
      lastUpdated: new Date().toISOString(),
    };
    db.saveAdminConfig(updated);
    setConfig(updated);
    setSaved(true);
    toast.success("Incentive rate updated successfully");
    setTimeout(() => setSaved(false), 3000);
  }

  const formattedDate = config.lastUpdated
    ? new Date(config.lastUpdated).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          Incentive &amp; Commission Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure the per-registration incentive paid to Field Executives
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4"
        data-ocid="admin.incentive_settings.info_banner"
      >
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Incentive rates apply globally to all Field Executives. Changes take
          effect immediately across FE Performance, Payroll, and Field
          Executives pages.
        </p>
      </div>

      {/* Success banner */}
      {saved && (
        <div
          className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-1"
          data-ocid="admin.incentive_settings.success_banner"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            Incentive rate updated successfully
          </p>
        </div>
      )}

      {/* FE Incentive Config card */}
      <div
        className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5"
        data-ocid="admin.incentive_settings.fe_config_card"
      >
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <IndianRupee className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">
            FE Incentive Configuration
          </h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fe-incentive-rate" className="text-sm font-medium">
            Incentive per Paid Registration (₹)
          </Label>
          <div className="flex items-center gap-3">
            <div className="relative w-36">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                ₹
              </span>
              <Input
                id="fe-incentive-rate"
                type="number"
                min={1}
                max={1000}
                value={inputRate}
                onChange={(e) => setInputRate(e.target.value)}
                className="pl-7 font-semibold text-foreground"
                data-ocid="admin.incentive_settings.fe_rate_input"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              per registration
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum ₹1, maximum ₹1,000 per paid registration
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Last updated:{" "}
            <span className="font-medium text-foreground">{formattedDate}</span>
          </div>
          <Button
            onClick={handleSave}
            className="teal-gradient text-white border-0 gap-2"
            data-ocid="admin.incentive_settings.save_button"
          >
            <CheckCircle2 className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* TL Commission Info card */}
      <div
        className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5"
        data-ocid="admin.incentive_settings.tl_config_card"
      >
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-foreground text-lg">
            TL Commission Info
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Team Leader Commission Rate
            </p>
            <p className="text-xs text-muted-foreground">
              Applied to all TLs based on their FE paid registrations
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-bold text-amber-700"
              data-ocid="admin.incentive_settings.tl_rate_display"
            >
              ₹{config.tlCommissionRate}
            </p>
            <p className="text-xs text-muted-foreground">per registration</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">
            Fixed — contact support to change
          </p>
        </div>
      </div>

      {/* Current rates summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-green-700 font-medium mb-1">
            Current FE Rate
          </p>
          <p className="text-3xl font-bold text-green-700">
            ₹{config.feIncentiveRate}
          </p>
          <p className="text-xs text-green-600 mt-1">per paid registration</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-700 font-medium mb-1">
            Current TL Rate
          </p>
          <p className="text-3xl font-bold text-amber-700">
            ₹{config.tlCommissionRate}
          </p>
          <p className="text-xs text-amber-600 mt-1">per paid registration</p>
        </div>
      </div>
    </div>
  );
}
