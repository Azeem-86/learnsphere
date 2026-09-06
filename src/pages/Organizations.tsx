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
  Building2,
  Plus,
  CheckCircle,
  XCircle,
  Globe,
  Clock,
  Users,
  BookOpen,
} from "lucide-react";

export default function Organizations() {
  const { profile, selectedOrg, selectOrg } = useApp();
  const isSuperAdmin = profile?.role === "super_admin";
  const isOrgAdmin = profile?.role === "org_admin";

  const allOrgs = useQuery(api.organizations.getAllOrganizations);
  const userOrgs = useQuery(api.organizations.getUserOrganizations);
  const createOrg = useMutation(api.organizations.createOrganization);
  const approveOrg = useMutation(api.organizations.approveOrganization);
  const deleteOrg = useMutation(api.organizations.deleteOrganization);

  const [showNewOrg, setShowNewOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const pendingOrgs = isSuperAdmin ? (allOrgs?.filter((o: any) => o.status === "pending") ?? []) : [];
  const approvedOrgs = isSuperAdmin ? (allOrgs?.filter((o: any) => o.status === "approved") ?? []) : [];

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error("Name and slug are required.");
      return;
    }
    setSaving(true);
    try {
      await createOrg({
        name: orgName.trim(),
        slug: orgSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: orgDesc?.trim() || undefined,
        website: orgWebsite?.trim() || undefined,
      });
      toast.success("Organization request submitted! Waiting for super admin approval.");
      setShowNewOrg(false);
      setOrgName("");
      setOrgSlug("");
      setOrgDesc("");
      setOrgWebsite("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (orgId: string, approved: boolean) => {
    try {
      await approveOrg({ orgId: orgId as any, approved });
      toast.success(approved ? "Organization approved!" : "Organization rejected.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">
              {isSuperAdmin ? "Organization Management" : "My Organization"}
            </h2>
            <p className="text-muted-foreground">
              {isSuperAdmin ? "Approve and manage all organizations" : "View your organization details"}
            </p>
          </div>
          {isOrgAdmin && (
            <Button className="clay-btn text-white" onClick={() => setShowNewOrg(true)}>
              <Plus className="mr-2 h-4 w-4" /> Request New Organization
            </Button>
          )}
        </div>

        {/* Super Admin: Pending Approvals */}
        {isSuperAdmin && pendingOrgs.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Pending Approvals ({pendingOrgs.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {pendingOrgs.map((org: any) => (
                <div key={org._id} className="clay-card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{org.name}</h4>
                    <Badge className="clay-badge text-xs bg-amber-50 text-amber-700">Pending</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{org.description}</p>
                  {org.website && (
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {org.website}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-3">
                    Slug: {org.slug} · Created {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="clay-btn text-white text-xs" onClick={() => handleApprove(org._id, true)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => handleApprove(org._id, false)}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Super Admin: All Organizations */}
        {isSuperAdmin && (
          <div>
            <h3 className="text-lg font-bold mb-3">All Organizations</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {approvedOrgs.map((org: any) => (
                <div key={org._id} className="clay-card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{org.name}</h4>
                    <Badge variant="default" className="clay-badge text-xs">Approved</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{org.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Slug: {org.slug} · {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {approvedOrgs.length === 0 && (
                <div className="clay-card p-10 text-center md:col-span-2">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No approved organizations</h3>
                  <p className="text-muted-foreground">Approve pending organization requests above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Org Admin: My Org Memberships */}
        {!isSuperAdmin && userOrgs && (
          <div>
            <h3 className="text-lg font-bold mb-3">Your Memberships</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {userOrgs.filter((m: any) => m.org).map((membership: any) => (
                <div
                  key={membership._id}
                  className={`clay-card p-5 cursor-pointer transition-all ${
                    selectedOrg?._id === membership.orgId ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => selectOrg(membership.orgId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{membership.org?.name}</h4>
                    <Badge variant={membership.status === "approved" ? "default" : "secondary"} className="clay-badge text-xs capitalize">
                      {membership.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{membership.org?.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {membership.role}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {membership.org?.slug}
                    </span>
                  </div>
                </div>
              ))}
              {userOrgs.filter((m: any) => m.org).length === 0 && (
                <div className="clay-card p-10 text-center md:col-span-2">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No organization yet</h3>
                  <p className="text-muted-foreground mb-4">Create an organization to get started.</p>
                  <Button className="clay-btn text-white" onClick={() => setShowNewOrg(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Request Organization
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Org Dialog */}
      <Dialog open={showNewOrg} onOpenChange={setShowNewOrg}>
        <DialogContent className="clay-card border-0">
          <DialogHeader>
            <DialogTitle>Request New Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => { setOrgName(e.target.value); setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                className="clay-input w-full px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug</label>
              <input
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <input
                type="url"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
                placeholder="https://..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewOrg(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
