import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { db } from "../../lib/storage";
import type { Registration } from "../../types/models";

// FE color palette
const FE_COLORS = ["#0F7C86", "#1697A0", "#9333EA", "#E85D04", "#2563EB"];

export default function MapPage() {
  const allRegs = useMemo(() => db.getRegistrations(), []);
  const allFEs = useMemo(() => db.getFEs(), []);

  const geoRegs = useMemo(
    () => allRegs.filter((r) => r.latitude !== null && r.longitude !== null),
    [allRegs],
  );

  const fesWithLocation = useMemo(() => {
    const feIds = new Set(geoRegs.map((r) => r.feId));
    return allFEs.filter((fe) => feIds.has(fe.id));
  }, [allFEs, geoRegs]);

  function getFeColor(feId: number): string {
    const idx = allFEs.findIndex((fe) => fe.id === feId);
    return FE_COLORS[idx % FE_COLORS.length];
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Map View</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Geographic distribution of student registrations
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-teal-800">{geoRegs.length}</p>
          <p className="text-xs text-teal-700 mt-1">Geo-tagged Registrations</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-800">
            {fesWithLocation.length}
          </p>
          <p className="text-xs text-blue-700 mt-1">FEs with Location Data</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-800">
            {new Set(geoRegs.map((r) => r.locationAddress)).size}
          </p>
          <p className="text-xs text-purple-700 mt-1">Unique Locations</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-800">
            {geoRegs.filter((r) => r.paymentStatus === "Paid").length}
          </p>
          <p className="text-xs text-green-700 mt-1">Paid in Area</p>
        </div>
      </div>

      {/* FE Legend */}
      {fesWithLocation.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {fesWithLocation.map((fe, idx) => (
            <div key={fe.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: FE_COLORS[idx % FE_COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground">
                {fe.name} ({fe.feCode})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map placeholder */}
        <div
          className="lg:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden"
          style={{ minHeight: 420 }}
          data-ocid="admin.map.canvas_target"
        >
          {geoRegs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-3">
              <MapPin className="h-12 w-12 opacity-30" />
              <p className="text-sm">No location data available</p>
              <p className="text-xs">
                GPS coordinates will appear here once FEs register students with
                location capture
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3" style={{ minHeight: 420 }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  Registration Locations
                </span>
              </div>
              {geoRegs.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getFeColor(reg.feId) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-medium text-sm text-foreground">
                        {reg.studentName}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          reg.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {reg.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reg.feName} \u2022 {reg.courseName}
                    </p>
                    {reg.locationAddress && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {reg.locationAddress}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lat: {reg.latitude?.toFixed(4)}, Lng:{" "}
                      {reg.longitude?.toFixed(4)} \u2022{" "}
                      {formatDate(reg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: geo-tagged registrations list */}
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Location Log</span>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {geoRegs.length === 0 ? (
              <div
                className="p-6 text-center text-sm text-muted-foreground"
                data-ocid="admin.map.empty_state"
              >
                No geo-tagged registrations
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {geoRegs.map((reg: Registration, idx: number) => (
                  <li
                    key={reg.id}
                    className="p-3 hover:bg-muted/20"
                    data-ocid={`admin.map.item.${idx + 1}`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getFeColor(reg.feId) }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {reg.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reg.feName}
                        </p>
                        {reg.locationAddress && (
                          <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {reg.locationAddress}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(reg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
