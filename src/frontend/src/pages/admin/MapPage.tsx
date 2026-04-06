import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { db } from "../../lib/storage";
import type { Registration } from "../../types/models";

// Fix Leaflet default icons
(L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl =
  undefined;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

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
        {/* Map */}
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
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={11}
              style={{ height: 420, width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoRegs.map((reg) => (
                <CircleMarker
                  key={reg.id}
                  center={[reg.latitude as number, reg.longitude as number]}
                  radius={10}
                  fillColor={getFeColor(reg.feId)}
                  color="white"
                  weight={2}
                  opacity={1}
                  fillOpacity={0.85}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-32">
                      <p className="font-bold text-sm">{reg.studentName}</p>
                      <p className="text-gray-500">{reg.studentPhone}</p>
                      <hr />
                      <p>
                        <span className="font-medium">FE:</span> {reg.feName}
                      </p>
                      <p>
                        <span className="font-medium">Course:</span>{" "}
                        {reg.courseName}
                      </p>
                      <p>
                        <span className="font-medium">Plan:</span> {reg.feePlan}{" "}
                        (₹{reg.price})
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(reg.createdAt)}
                      </p>
                      {reg.locationAddress && (
                        <p>
                          <span className="font-medium">Location:</span>{" "}
                          {reg.locationAddress}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
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
