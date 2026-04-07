// client/src/pages/organization-settings.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Upload, Save, Loader2 } from "lucide-react";

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
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

  // Only admin can access this page
  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2 text-muted-foreground">
        <Building2 className="w-10 h-10 opacity-30" />
        <p className="font-medium">Access Denied</p>
        <p className="text-sm">
          Only administrators can manage organization settings.
        </p>
      </div>
    );
  }

  // Fetch existing org data
  const { data: org, isLoading } = useQuery({
    queryKey: ["/api/auth/organization"],
    queryFn: async () => {
      const res = await fetch("/api/auth/organization", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Pre-fill form when org data loads
  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "",
        address: org.address || "",
        city: org.city || "",
        state: org.state || "",
        pincode: org.pincode || "",
        phone: org.phone || "",
        email: org.email || "",
        website: org.website || "",
        type: org.type || "coaching",
        boardAffiliation: org.boardAffiliation || "",
        principalName: org.principalName || "",
        establishedYear: org.establishedYear || "",
        logo: org.logo || "",
      });
      if (org.logo) setLogoPreview(org.logo);
    }
  }, [org]);

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

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const method = org ? "PUT" : "POST";
      const url = org ? "/api/auth/organization" : "/api/auth/onboarding";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Organization settings saved successfully" });
      // Refresh org data everywhere — sidebar logo/name update ho
      queryClient.invalidateQueries({ queryKey: ["/api/auth/organization"] });
      // Go to dashboard
      navigate("/");
    },
    onError: (e: any) => {
      toast({
        title: e.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Organization name is required", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your institute's details. This information appears on invoices
          and reports.
        </p>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Institute Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="text-sm">Logo</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  PNG or JPG, max 2MB
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogo}
                  className="text-xs text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm">Organization Name *</Label>
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Bright Future Coaching Institute"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger className="rounded-xl">
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
                <Label className="text-sm">Board Affiliation</Label>
                <Input
                  value={form.boardAffiliation}
                  onChange={set("boardAffiliation")}
                  placeholder="CBSE, ICSE, State Board..."
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Principal / Director Name</Label>
                <Input
                  value={form.principalName}
                  onChange={set("principalName")}
                  placeholder="Full name"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Established Year</Label>
                <Input
                  value={form.establishedYear}
                  onChange={set("establishedYear")}
                  placeholder="e.g. 2010"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm">Address</Label>
                <Input
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Street address"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">City</Label>
                <Input
                  value={form.city}
                  onChange={set("city")}
                  placeholder="City"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">State</Label>
                <Input
                  value={form.state}
                  onChange={set("state")}
                  placeholder="State"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={set("pincode")}
                  placeholder="6-digit pincode"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Contact Phone</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="Office phone number"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Contact Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="office@yourschool.com"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Website</Label>
                <Input
                  value={form.website}
                  onChange={set("website")}
                  placeholder="https://yourschool.com"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="gap-2"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
