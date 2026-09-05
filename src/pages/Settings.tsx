import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Shield, Save, Building2 } from "lucide-react";

export default function Settings() {
  const { profile, selectedOrg, memberships } = useApp();
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState(profile?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <div className="clay-card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Profile
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <div className="clay-inset flex items-center gap-2 px-4 py-2.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile?.email}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <div className="clay-inset flex items-center gap-2 px-4 py-2.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">{profile?.role?.replace("_", " ")}</span>
              </div>
            </div>

            <Button className="clay-btn text-white" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Organization */}
        <div className="clay-card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Organization
          </h3>

          {selectedOrg ? (
            <div className="clay-inset p-4 rounded-2xl">
              <p className="font-semibold">{selectedOrg.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedOrg.description}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No organization selected</p>
          )}

          {memberships.length > 1 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Your Organizations:</p>
              <div className="space-y-2">
                {memberships.map((m: any) => (
                  <div key={m._id} className="flex items-center justify-between clay-sm p-3 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{m.org?.name}</p>
                      <Badge variant="secondary" className="clay-badge text-xs mt-1">{m.role?.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="clay-card p-6 border-destructive/30">
          <h3 className="font-bold mb-2 text-destructive">Account</h3>
          <p className="text-sm text-muted-foreground">
            To deactivate your account, please contact your organization administrator.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
