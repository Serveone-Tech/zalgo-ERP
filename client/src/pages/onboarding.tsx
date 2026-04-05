// client/src/pages/onboarding.tsx
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Upload, CheckCircle2 } from "lucide-react";

interface OnboardingPageProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    type: "coaching",
    boardAffiliation: "",
    principalName: "",
    establishedYear: "",
    logo: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo must be under 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setLogoPreview(b64);
      setForm((f) => ({ ...f, logo: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Organization name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message || "Setup failed", variant: "destructive" });
        return;
      }
      toast({ title: "Setup complete! Welcome aboard." });
      onComplete();
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[hsl(220,25%,12%)] to-slate-800 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Set Up Your Organization</h1>
            <p className="text-sm text-white/50 mt-1">
              Tell us about your school or coaching center to get started
            </p>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/50">Account Created</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-white/50">Plan Selected</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">3</span>
              </div>
              <span className="text-xs text-white font-medium">Organization Setup</span>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Organization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Logo upload */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/5">
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="w-6 h-6 text-white/30" />
                  )}
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Logo (optional)</Label>
                  <p className="text-xs text-white/30 mb-2">PNG or JPG, max 2MB</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleLogo}
                    className="text-xs text-white/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-white/70 text-sm">Organization Name *</Label>
                  <Input
                    value={form.name}
                    onChange={set("name")}
                    placeholder="e.g. Bright Future Coaching Institute"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coaching">Coaching Institute</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="tuition">Tuition Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Board Affiliation</Label>
                  <Input
                    value={form.boardAffiliation}
                    onChange={set("boardAffiliation")}
                    placeholder="CBSE, ICSE, State Board, etc."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Principal / Director Name</Label>
                  <Input
                    value={form.principalName}
                    onChange={set("principalName")}
                    placeholder="Full name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Established Year</Label>
                  <Input
                    value={form.establishedYear}
                    onChange={set("establishedYear")}
                    placeholder="e.g. 2010"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-white/70 text-sm">Address</Label>
                  <Input
                    value={form.address}
                    onChange={set("address")}
                    placeholder="Street address"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">City</Label>
                  <Input
                    value={form.city}
                    onChange={set("city")}
                    placeholder="City"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">State</Label>
                  <Input
                    value={form.state}
                    onChange={set("state")}
                    placeholder="State"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Pincode</Label>
                  <Input
                    value={form.pincode}
                    onChange={set("pincode")}
                    placeholder="6-digit pincode"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Contact Phone</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="Office phone number"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Contact Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="office@yourschool.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm">Website (optional)</Label>
                  <Input
                    value={form.website}
                    onChange={set("website")}
                    placeholder="https://yourschool.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Complete Setup &amp; Go to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
