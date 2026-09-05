import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams, Link } from "react-router";
import { GraduationCap, CheckCircle2, XCircle, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);

  const cert = useQuery(
    api.certificates.verifyCertificate,
    initialCode ? { verificationCode: initialCode } : "skip"
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="clay-flat border-b border-border/50 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary clay-sm">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">LearnSphere</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Search */}
          <div className="clay-card p-6">
            <h2 className="text-xl font-bold mb-2">Verify Certificate</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a verification code to check the authenticity of a LearnSphere certificate.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="clay-input flex-1 px-4 py-2.5 text-sm font-mono"
                placeholder="e.g. VER-BP-LEADERSHIP-001"
              />
              <Button
                asChild
                className="clay-btn text-white"
                disabled={!code.trim()}
              >
                <Link to={`?code=${encodeURIComponent(code)}`}>Verify</Link>
              </Button>
            </div>
          </div>

          {/* Result */}
          {initialCode && cert !== undefined && (
            cert ? (
              <div className="clay-card overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-6 text-center border-b border-border/50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 clay-sm mx-auto mb-3">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 mb-1">✓ Valid Certificate</p>
                  <h3 className="text-lg font-bold">{cert.courseName}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="clay-inset p-4 rounded-2xl text-center">
                    <p className="text-sm text-muted-foreground">Awarded to</p>
                    <p className="text-xl font-bold">{cert.learnerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="clay-inset p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Organization</p>
                      <p className="font-medium text-xs">{cert.orgName}</p>
                    </div>
                    <div className="clay-inset p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Completion Date</p>
                      <p className="font-medium text-xs">{new Date(cert.completionDate).toLocaleDateString()}</p>
                    </div>
                    <div className="clay-inset p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Certificate ID</p>
                      <p className="font-medium text-xs font-mono">{cert.certificateId}</p>
                    </div>
                    <div className="clay-inset p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Verification Code</p>
                      <p className="font-medium text-xs font-mono">{cert.verificationCode}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="clay-card p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 clay-sm mx-auto mb-3">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Certificate Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  No certificate matches the verification code "{initialCode}". Please check the code and try again.
                </p>
              </div>
            )
          )}

          {!initialCode && (
            <div className="clay-card p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Enter a verification code above to validate a LearnSphere certificate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
