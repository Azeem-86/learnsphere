import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  UserPlus,
  CheckCircle,
  XCircle,
  Trash2,
  Shield,
  GraduationCap,
  BookOpen,
  Clock,
  Mail,
} from "lucide-react";

export default function Members() {
  const { profile, selectedOrg } = useApp();
  const isOrgAdmin = profile?.role === "org_admin";
  const isSuperAdmin = profile?.role === "super_admin";

  const members = useQuery(
    api.users.getOrgMembers,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const pendingApps = useQuery(
    api.users.getPendingApplications,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );

  const approveInstructor = useMutation(api.users.approveInstructor);
  const removeMember = useMutation(api.users.removeMember);
  const toggleActive = useMutation(api.users.toggleMemberActive);
  const updateRole = useMutation(api.users.updateMemberRole);
  const inviteMember = useMutation(api.users.inviteMember);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"instructor" | "learner">("learner");
  const [saving, setSaving] = useState(false);

  const approvedMembers = members?.filter((m: any) => m.status === "approved") ?? [];
  const rejectedMembers = members?.filter((m: any) => m.status === "rejected") ?? [];

  const handleApprove = async (memberId: string, approved: boolean) => {
    try {
      await approveInstructor({ memberId: memberId as any, approved });
      toast.success(approved ? "Instructor approved!" : "Application rejected.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember({ memberId: memberId as any });
      toast.success("Member removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    try {
      await toggleActive({ memberId: memberId as any, isActive });
      toast.success(isActive ? "Member activated." : "Member deactivated.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    if (!selectedOrg) {
      toast.error("No organization selected.");
      return;
    }
    setSaving(true);
    try {
      await inviteMember({
        orgId: selectedOrg._id,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("learner");
    } catch (err: any) {
      toast.error(err.message || "Failed to invite");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedOrg) {
    return (
      <AppLayout>
        <div className="clay-card p-10 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
          <p className="text-muted-foreground">Select an organization from your dashboard first.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Members</h2>
            <p className="text-muted-foreground">
              Manage members of {selectedOrg.name}
            </p>
          </div>
          {isOrgAdmin && (
            <Button className="clay-btn text-white" onClick={() => setShowInvite(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite Member
            </Button>
          )}
        </div>

        {/* Pending Instructor Applications */}
        {isOrgAdmin && pendingApps && pendingApps.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Pending Instructor Applications ({pendingApps.length})
            </h3>
            <div className="space-y-3">
              {pendingApps.map((app: any) => (
                <div key={app._id} className="clay-card p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 clay-sm">
                        <span className="text-sm font-bold text-primary">
                          {app.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{app.user?.name ?? "Unknown"}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {app.user?.email}
                        </p>
                        {app.applicationMessage && (
                          <p className="text-sm text-muted-foreground mt-1 italic">"{app.applicationMessage}"</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {app.user?.qualifications && (
                            <span>📚 {app.user.qualifications}</span>
                          )}
                          {app.user?.institution && (
                            <span>🏫 {app.user.institution}</span>
                          )}
                          {app.user?.bio && (
                            <span>💼 {app.user.bio.slice(0, 80)}...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="clay-btn text-white text-xs" onClick={() => handleApprove(app._id, true)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => handleApprove(app._id, false)}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Members */}
        <div>
          <h3 className="text-lg font-bold mb-3">
            Members ({approvedMembers.length})
          </h3>
          {approvedMembers.length > 0 ? (
            <div className="clay-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      {isOrgAdmin && <th className="text-right py-3 px-4 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {approvedMembers.map((member: any) => (
                      <tr key={member._id} className="border-b border-border/30 last:border-0">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 clay-sm">
                              <span className="text-xs font-bold text-primary">
                                {member.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                              </span>
                            </div>
                            <span className="font-medium">{member.user?.name ?? "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{member.user?.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="clay-badge text-xs capitalize">
                            {member.role === "instructor" && <BookOpen className="h-3 w-3 mr-1" />}
                            {member.role === "org_admin" && <Shield className="h-3 w-3 mr-1" />}
                            {member.role === "learner" && <GraduationCap className="h-3 w-3 mr-1" />}
                            {member.role?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.isActive ? "text-emerald-600" : "text-red-500"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {isOrgAdmin && (
                          <td className="py-3 px-4 text-right">
                            {member.userId !== profile?._id && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => handleToggleActive(member._id, !member.isActive)}
                                >
                                  {member.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 text-destructive"
                                  onClick={() => handleRemove(member._id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="clay-card p-10 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members yet</h3>
              <p className="text-muted-foreground mb-4">Invite members to get started.</p>
              {isOrgAdmin && (
                <Button className="clay-btn text-white" onClick={() => setShowInvite(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Rejected Members */}
        {rejectedMembers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Rejected Applications ({rejectedMembers.length})
            </h3>
            <div className="space-y-2">
              {rejectedMembers.map((member: any) => (
                <div key={member._id} className="clay-card p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{member.user?.name ?? "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{member.user?.email}</span>
                  </div>
                  <Badge className="clay-badge text-xs bg-red-50 text-red-700">Rejected</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="clay-card border-0">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInviteRole("instructor")}
                  className={`clay-card p-3 text-left transition-all ${inviteRole === "instructor" ? "ring-2 ring-primary" : ""}`}
                >
                  <BookOpen className="h-4 w-4 mb-1" />
                  <p className="text-sm font-medium">Instructor</p>
                  <p className="text-xs text-muted-foreground">Can create courses</p>
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole("learner")}
                  className={`clay-card p-3 text-left transition-all ${inviteRole === "learner" ? "ring-2 ring-primary" : ""}`}
                >
                  <GraduationCap className="h-4 w-4 mb-1" />
                  <p className="text-sm font-medium">Learner</p>
                  <p className="text-xs text-muted-foreground">Can browse & enroll</p>
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>
                {saving ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
