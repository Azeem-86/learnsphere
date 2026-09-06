import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, User } from "lucide-react";

export default function Settings() {
  const { profile } = useApp();
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
      setInstitution(profile.institution ?? "");
      setQualifications(profile.qualifications ?? "");
      setDateOfBirth(profile.dateOfBirth ?? "");
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: name || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
        institution: institution || undefined,
        qualifications: qualifications || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your profile and academic details</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <div className="clay-card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" /> Basic Information
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
                <input
                  type="email"
                  value={profile?.email ?? ""}
                  className="clay-input w-full px-4 py-2.5 text-sm opacity-60"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 text-sm"
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          {/* Academic / Professional Info */}
          <div className="clay-card p-5">
            <h3 className="font-bold mb-4">
              {(profile?.role === "instructor" || profile?.role === "learner") ? "Academic & Professional Details" : "Professional Details"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {profile?.role === "instructor" ? "Institution / University" : "Institution / School"}
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 text-sm"
                  placeholder={profile?.role === "instructor" ? "e.g., MIT, Stanford" : "e.g., University of California"}
                />
              </div>
              {profile?.role === "instructor" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Qualifications</label>
                  <input
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="clay-input w-full px-4 py-2.5 text-sm"
                    placeholder="e.g., PhD Computer Science, MBA, Google Developer Expert"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Bio / About</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="clay-input w-full px-4 py-2.5 text-sm min-h-[100px]"
                  placeholder={
                    profile?.role === "instructor"
                      ? "Tell learners about your expertise and teaching style..."
                      : "Tell us about your learning goals..."
                  }
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="clay-btn text-white" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
