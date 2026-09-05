import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { Award, Calendar, CheckCircle2, ExternalLink, Trophy } from "lucide-react";

export default function Certificates() {
  const certificates = useQuery(api.certificates.getUserCertificates);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Certificates</h2>
          <p className="text-muted-foreground">Your earned certificates and achievements</p>
        </div>

        {certificates && certificates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {certificates.map((cert: any) => (
              <div key={cert._id} className="clay-card overflow-hidden">
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 text-center border-b border-border/50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-50 clay-sm mx-auto mb-3">
                    <Trophy className="h-7 w-7 text-amber-600" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Certificate of Completion</p>
                  <h3 className="text-lg font-bold">{cert.courseName}</h3>
                </div>

                {/* Certificate Body */}
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
                      <p className="text-xs text-muted-foreground">Completion</p>
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

                  <Button asChild variant="ghost" className="clay-sm rounded-xl w-full text-sm">
                    <Link to={`/verify?code=${cert.verificationCode}`}>
                      <ExternalLink className="mr-2 h-3 w-3" /> Verify Certificate
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="clay-card p-10 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
            <p className="text-muted-foreground mb-4">Complete a course to earn your first certificate!</p>
            <Button asChild className="clay-btn text-white">
              <Link to="/dashboard/my-courses">My Courses</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
