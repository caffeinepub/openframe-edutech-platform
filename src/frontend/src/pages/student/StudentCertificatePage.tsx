import { Button } from "@/components/ui/button";
import { Award, Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { CertificateView } from "../../components/CertificateView";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Certificate } from "../../types/models";

export default function StudentCertificatePage() {
  const { session } = useApp();
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (!session?.id) return;
    const certs = db.getCertificates();
    const myCert = certs.find((c) => c.studentId === session.id);
    if (myCert) setCert(myCert);
  }, [session]);

  if (!cert) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-2">
          No Certificate Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Complete the exam and achieve a passing score to earn your
          certificate.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Certificate</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Download or print your achievement
        </p>
      </div>

      <div id="certificate-print">
        <CertificateView cert={cert} />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => window.print()}
          className="teal-gradient text-white border-0 gap-2"
          data-ocid="student.certificate.print_button"
        >
          <Printer className="h-4 w-4" /> Print Certificate
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2"
          data-ocid="student.certificate.download_button"
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>
    </div>
  );
}
