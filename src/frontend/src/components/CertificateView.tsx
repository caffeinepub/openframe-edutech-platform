import type { Certificate } from "../types/models";

const QR_CELLS = [0, 2, 4, 6, 9, 11, 13, 15];
const QR_KEYS = Array.from({ length: 16 }, (_, i) => `qr-cell-${i}`);

export function CertificateView({ cert }: { cert: Certificate }) {
  return (
    <div
      className="border-4 border-primary/60 rounded-2xl p-8 bg-white text-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #f0fdfa 0%, #fff 50%, #f0f9ff 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Decorative corner */}
      <div className="absolute top-0 left-0 w-20 h-20 border-r-4 border-b-4 border-primary/20 rounded-br-3xl" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-l-4 border-t-4 border-primary/20 rounded-tl-3xl" />

      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-10 h-10 teal-gradient rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">OF</span>
        </div>
        <span className="text-lg font-bold text-foreground">
          OpenFrame EduTech
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-6 uppercase tracking-widest">
        Certificate of Completion
      </p>

      <p className="text-sm text-muted-foreground mb-2">
        This is to certify that
      </p>
      <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
        {cert.studentName}
      </h2>
      <p className="text-sm text-muted-foreground mb-2">
        has successfully completed
      </p>
      <h3 className="text-xl font-bold text-primary mb-6">{cert.courseName}</h3>

      {/* QR-like placeholder */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 grid grid-cols-4 grid-rows-4 gap-0.5 p-1 bg-muted rounded">
          {QR_KEYS.map((key, i) => (
            <div
              key={key}
              className="rounded-sm"
              style={{
                backgroundColor: QR_CELLS.includes(i)
                  ? "#0F7C86"
                  : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-4">
        <div>
          <p className="font-semibold text-foreground">{cert.certNumber}</p>
          <p>Certificate ID</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="font-semibold text-foreground">
            {new Date(cert.issuedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p>Issue Date</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <div className="border-b border-foreground w-24 mb-0.5" />
          <p>Authorised Signature</p>
        </div>
      </div>
    </div>
  );
}
