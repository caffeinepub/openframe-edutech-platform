import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, Eye, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { CertificateView } from "../../components/CertificateView";
import { EmptyState } from "../../components/EmptyState";
import { db } from "../../lib/storage";
import type { Certificate } from "../../types/models";

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);

  useEffect(() => {
    setCerts(db.getCertificates());
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {certs.length} certificates issued
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {certs.length === 0 ? (
          <EmptyState
            title="No certificates issued yet"
            description="Certificates are generated automatically when students pass their exams"
            icon={Award}
            data-ocid="admin.certificates.empty_state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              data-ocid="admin.certificates.table"
            >
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Cert #",
                    "Student Name",
                    "Course",
                    "Issue Date",
                    "Actions",
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
                {certs.map((cert, idx) => (
                  <tr
                    key={cert.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                    data-ocid={`admin.certificate.item.${idx + 1}`}
                  >
                    <td className="p-4">
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {cert.certNumber}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {cert.studentName}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {cert.courseName}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(cert.issuedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setViewCert(cert)}
                        data-ocid={`admin.certificate.view_button.${idx + 1}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate View Dialog */}
      <Dialog open={!!viewCert} onOpenChange={(o) => !o && setViewCert(null)}>
        <DialogContent
          className="max-w-2xl"
          data-ocid="admin.certificate.dialog"
        >
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          {viewCert && (
            <div>
              <CertificateView cert={viewCert} />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => window.print()}
                  className="teal-gradient text-white border-0 gap-2"
                  data-ocid="admin.certificate.print_button"
                >
                  <Printer className="h-4 w-4" /> Print Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
