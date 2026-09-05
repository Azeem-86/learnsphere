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
  Globe,
  Users,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

export default function Organizations() {
  const { profile } = useApp();
  const orgs = useQuery(api.organizations.getUserOrganizations);
  const createOrg = useMutation(api.organizations.createOrganization);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = profile?.role === "super_admin";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createOrg({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description: description || undefined,
      });
      setShowCreate(false);
      setName("");
      setSlug("");
      setDescription("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Organizations</h2>
            <p className="text-muted-foreground">Manage training organizations</p>
          </div>
          {isSuperAdmin && (
            <Button className="clay-btn text-white" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Organization
            </Button>
          )}
        </div>

        {orgs && orgs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {orgs.map((membership: any) => {
              const org = membership.org;
              if (!org) return null;
              return (
                <div key={org._id} className="clay-card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 clay-sm">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{org.name}</h3>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                    </div>
                    <Badge variant={org.isActive ? "default" : "destructive"} className="clay-badge text-xs">
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {org.description && (
                    <p className="text-sm text-muted-foreground mb-3">{org.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="clay-badge text-xs capitalize">
                      Your role: {membership.role?.replace("_", " ")}
                    </Badge>
                    {org.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {org.website}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="clay-card p-10 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground mb-4">Create your first organization to get started.</p>
            <Button className="clay-btn text-white" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="clay-card border-0">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
                placeholder="BrightPath Academy"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
                placeholder="brightpath-academy"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm min-h-[80px]"
                placeholder="Professional skills training..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>
                {saving ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
