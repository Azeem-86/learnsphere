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
  UserPlus,
  Shield,
  GraduationCap,
  PenTool,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Search,
} from "lucide-react";

const roleIcons: Record<string, any> = {
  org_admin: <Shield className="h-4 w-4" />,
  instructor: <PenTool className="h-4 w-4" />,
  learner: <GraduationCap className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  org_admin: "bg-amber-50 text-amber-700",
  instructor: "bg-blue-50 text-blue-700",
  learner: "bg-emerald-50 text-emerald-700",
};

export default function Members() {
  const { selectedOrg } = useApp();
  const members = useQuery(
    api.users.getOrgMembers,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const inviteMember = useMutation(api.users.inviteMember);
  const toggleActive = useMutation(api.users.toggleMemberActive);
  const updateRole = useMutation(api.users.updateMemberRole);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("learner");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = members?.filter((m: any) =>
    m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setSaving(true);
    try {
      await inviteMember({
        orgId: selectedOrg._id,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole as any,
      });
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("learner");
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Members</h2>
            <p className="text-muted-foreground">Manage organization members and roles</p>
          </div>
          <Button className="clay-btn text-white" onClick={() => setShowInvite(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        </div>

        {/* Search */}
        <div className="clay-inset flex items-center px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>

        {/* Members Table */}
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold">Member</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Joined</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: any) => (
                  <tr key={m._id} className="border-b border-border/30 last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="clay-avatar h-8 w-8 flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                          {m.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium">{m.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className={`clay-badge text-xs flex items-center gap-1 w-fit ${roleColors[m.role] ?? ""}`}>
                        {roleIcons[m.role]} <span className="capitalize">{m.role?.replace("_", " ")}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.isActive ? "text-emerald-600" : "text-red-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${m.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleActive({ memberId: m._id, isActive: !m.isActive })}
                        >
                          {m.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
            </div>
          )}
        </div>
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
              <div className="grid grid-cols-3 gap-2">
                {["learner", "instructor", "org_admin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={`clay-card p-3 text-center text-xs font-medium capitalize transition-all ${
                      inviteRole === r ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    {r.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>
                {saving ? "Inviting..." : "Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
