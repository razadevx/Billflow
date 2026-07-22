"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash, Link as LinkIcon, Building2, Settings2, Users as UsersIcon, Mail, Hash, Printer, Info, ImagePlus, UploadCloud, X } from "lucide-react";
import { format, isValid } from "date-fns";

const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isValid(date) ? format(date, formatStr) : "Invalid Date";
};

type User = { id: string; name: string; email: string; role: string; createdAt: string };
type Setting = { id: string; key: string; value: string };
type Company = { id: string; name: string; email: string | null; phone: string | null; address: string | null; taxId: string | null; };
type Sequence = { id: string; type: string; lastValue: number; };
type Invitation = { id: string; email: string; role: string; token: string; expiresAt: string; acceptedAt: string | null; };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: adminData, isLoading: loading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const [usersRes, settingsRes, companyRes, sequencesRes, invitesRes] = await Promise.all([
        fetch("/api/v1/administration/users"),
        fetch("/api/v1/administration/settings"),
        fetch("/api/v1/administration/company"),
        fetch("/api/v1/administration/sequences"),
        fetch("/api/v1/administration/invitations"),
      ]);

      if (!companyRes.ok) throw new Error("Failed to load administration data");

      const [usersData, settingsData, companyData, seqData, invData] = await Promise.all([
        usersRes.ok ? usersRes.json().catch(() => []) : [],
        settingsRes.ok ? settingsRes.json().catch(() => []) : [],
        companyRes.ok ? companyRes.json().catch(() => null) : null,
        sequencesRes.ok ? sequencesRes.json().catch(() => []) : [],
        invitesRes.ok ? invitesRes.json().catch(() => []) : []
      ]);

      return {
        users: Array.isArray(usersData) ? usersData : [],
        settings: Array.isArray(settingsData) ? settingsData : [],
        company: companyData,
        sequences: Array.isArray(seqData) ? seqData : [],
        invitations: Array.isArray(invData) ? invData : []
      };
    }
  });

  const users = adminData?.users || [];
  const settings = adminData?.settings || [];
  const company = adminData?.company || null;
  const sequences = adminData?.sequences || [];
  const invitations = adminData?.invitations || [];

  // Form states
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  
  // Settings forms
  const [sGeneral, setSGeneral] = useState({ COMPANY_LOGO: "", TIMEZONE: "Asia/Karachi", DATE_FORMAT: "PPP", CURRENCY: "PKR", CURRENCY_SYMBOL: "Rs" });
  const [sFinancial, setSFinancial] = useState({ DEFAULT_TAX_RATE: "0", INVOICE_DUE_DAYS: "30", DECIMAL_PRECISION: "0", NUMBER_FORMAT: "en-PK" });
  const [sPrinting, setSPrinting] = useState({ PRINT_LOGO: "true", PRINT_TAX: "true", PRINT_BALANCE: "true", PRINT_PAPER_SIZE: "A4", PRINT_FOOTER: "Thank you for your business!" });

  // Invitations
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");

  // User editing
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      setSGeneral(prev => ({ ...prev, COMPANY_LOGO: data.url }));
      toast.success("Logo uploaded successfully");
      
      // Auto-save the setting immediately to make it smoother
      await fetch("/api/v1/administration/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "COMPANY_LOGO", value: data.url })
      });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: any) {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    setSGeneral(prev => ({ ...prev, COMPANY_LOGO: "" }));
    try {
      await fetch("/api/v1/administration/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "COMPANY_LOGO", value: "" })
      });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Logo removed");
    } catch (err) {
      toast.error("Failed to remove logo");
    }
  };

  useEffect(() => {
    if (adminData) {
      setCompanyForm(adminData.company || {});

      const getS = (k: string, d: string) => adminData.settings.find((s: Setting) => s.key === k)?.value ?? d;
      
      setSGeneral({
        COMPANY_LOGO: getS("COMPANY_LOGO", ""),
        TIMEZONE: getS("TIMEZONE", "Asia/Karachi"),
        DATE_FORMAT: getS("DATE_FORMAT", "PPP"),
        CURRENCY: getS("CURRENCY", "PKR"),
        CURRENCY_SYMBOL: getS("CURRENCY_SYMBOL", "Rs"),
      });

      setSFinancial({
        DEFAULT_TAX_RATE: getS("DEFAULT_TAX_RATE", "0"),
        INVOICE_DUE_DAYS: getS("INVOICE_DUE_DAYS", "30"),
        DECIMAL_PRECISION: getS("DECIMAL_PRECISION", "0"),
        NUMBER_FORMAT: getS("NUMBER_FORMAT", "en-PK"),
      });

      setSPrinting({
        PRINT_LOGO: getS("PRINT_LOGO", "true"),
        PRINT_TAX: getS("PRINT_TAX", "true"),
        PRINT_BALANCE: getS("PRINT_BALANCE", "true"),
        PRINT_PAPER_SIZE: getS("PRINT_PAPER_SIZE", "A4"),
        PRINT_FOOTER: getS("PRINT_FOOTER", "Thank you for your business!"),
      });
    }
  }, [adminData]);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab) setActiveTab(tab === "profile" ? "users" : tab);
  }, []);

  const saveCompany = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/administration/company", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm)
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Company profile updated");
    } catch (err: any) {
      toast.error("Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const saveSettingsGroup = async (group: Record<string, string>) => {
    setSaving(true);
    try {
      const promises = Object.entries(group).map(([key, value]) =>
        fetch("/api/v1/administration/settings", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: String(value) })
        })
      );
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/v1/administration/users", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("User role updated");
    } catch (err: any) {
      toast.error("Failed to update user role");
    }
  };

  const updateUserDetails = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/administration/users", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, name: editUserName, email: editUserEmail })
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("User details updated");
      setEditingUser(null);
    } catch (err: any) {
      toast.error("Failed to update user details");
    } finally {
      setSaving(false);
    }
  };

  const createInvitation = async () => {
    try {
      const res = await fetch("/api/v1/administration/invitations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create invitation");
      }
      toast.success("Invitation created");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const revokeInvitation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/administration/invitations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Invitation revoked");
    } catch (err) {
      toast.error("Failed to revoke invitation");
    }
  };

  const updateSequence = async (id: string, lastValue: number) => {
    try {
      const res = await fetch("/api/v1/administration/sequences", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lastValue })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update sequence");
      }
      toast.success("Sequence updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Administration" description="Manage company settings and users." />
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Administration" description="Manage company settings and users." />
        <div className="bg-destructive/10 text-destructive border-destructive rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-xl font-bold mb-2">Error Loading Administration</h3>
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Settings" description="Manage company profile, currency, users, numbering, and print rules." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Currency</CardTitle>
            <CardDescription>Amounts display across the app as Pakistani Rupees.</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{sGeneral.CURRENCY_SYMBOL} · {sGeneral.CURRENCY}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>Active users and invitations.</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{users.length} users</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Numbering</CardTitle>
            <CardDescription>Customer, work order, invoice, and receipt sequences.</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{sequences.length} sequences</CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-8 h-12">
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-2 hidden sm:block" /> Company</TabsTrigger>
          <TabsTrigger value="business"><Settings2 className="w-4 h-4 mr-2 hidden sm:block" /> Business</TabsTrigger>
          <TabsTrigger value="users"><UsersIcon className="w-4 h-4 mr-2 hidden sm:block" /> Users</TabsTrigger>
          <TabsTrigger value="invitations"><Mail className="w-4 h-4 mr-2 hidden sm:block" /> Invitations</TabsTrigger>
          <TabsTrigger value="numbering"><Hash className="w-4 h-4 mr-2 hidden sm:block" /> Numbering</TabsTrigger>
          <TabsTrigger value="printing"><Printer className="w-4 h-4 mr-2 hidden sm:block" /> Printing</TabsTrigger>
          <TabsTrigger value="about"><Info className="w-4 h-4 mr-2 hidden sm:block" /> About</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="max-w-2xl shadow-sm border border-border">
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Primary company details displayed on invoices and reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Company Name</Label>
                  <Input value={companyForm.name ?? ""} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID / GST / VAT</Label>
                  <Input value={companyForm.taxId ?? ""} onChange={e => setCompanyForm({...companyForm, taxId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={companyForm.email ?? ""} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={companyForm.phone ?? ""} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Full Address</Label>
                  <Textarea value={companyForm.address ?? ""} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} rows={3} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-slate-50 py-4">
              <Button onClick={saveCompany} disabled={saving}>Save Company Profile</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Label>Company Logo</Label>
                  {sGeneral.COMPANY_LOGO ? (
                    <div className="relative inline-block border rounded-xl overflow-hidden bg-white/50 p-4 w-full max-w-sm flex flex-col items-center justify-center min-h-[160px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sGeneral.COMPANY_LOGO} alt="Company Logo" className="max-h-32 object-contain" />
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                          <UploadCloud className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="danger" size="icon" className="h-8 w-8 rounded-full shadow-sm" onClick={removeLogo}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </div>
                  ) : (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center max-w-sm transition-colors ${uploadingLogo ? 'bg-muted opacity-50' : 'hover:bg-muted/50 border-muted-foreground/25 cursor-pointer'}`}
                      onClick={() => !uploadingLogo && document.getElementById('logo-upload-empty')?.click()}
                    >
                      <ImagePlus className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-sm">Upload Logo</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">PNG, JPG or SVG • Max 2MB</p>
                      <input id="logo-upload-empty" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingLogo}>
                        {uploadingLogo ? "Uploading..." : "Select File"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Input value={sGeneral.TIMEZONE} onChange={e => setSGeneral({...sGeneral, TIMEZONE: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency Code</Label>
                    <Input value={sGeneral.CURRENCY} onChange={e => setSGeneral({...sGeneral, CURRENCY: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Symbol</Label>
                    <Input value={sGeneral.CURRENCY_SYMBOL} onChange={e => setSGeneral({...sGeneral, CURRENCY_SYMBOL: e.target.value})} />
                  </div>
                </div>
                <Button onClick={() => saveSettingsGroup(sGeneral)} disabled={saving} className="w-full">Save General Settings</Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Financial Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Tax Rate (%)</Label>
                  <Input type="number" min="0" value={sFinancial.DEFAULT_TAX_RATE} onChange={e => setSFinancial({...sFinancial, DEFAULT_TAX_RATE: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Due Days</Label>
                  <Input type="number" min="0" value={sFinancial.INVOICE_DUE_DAYS} onChange={e => setSFinancial({...sFinancial, INVOICE_DUE_DAYS: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Decimal Precision</Label>
                  <Select value={sFinancial.DECIMAL_PRECISION} onValueChange={v => setSFinancial({...sFinancial, DECIMAL_PRECISION: v ?? "2"})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 (e.g. Rs 1,000)</SelectItem>
                      <SelectItem value="2">2 (e.g. Rs 1,000.50)</SelectItem>
                      <SelectItem value="3">3 (e.g. Rs 1,000.500)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => saveSettingsGroup(sFinancial)} disabled={saving} className="w-full">Save Financial Rules</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Role Permissions Matrix</CardTitle>
                <CardDescription>Hardcoded permissions across the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions Overview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold text-primary">OWNER</TableCell>
                      <TableCell>Full access. Can manage billing, delete the company, and change all settings.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold text-indigo-600">ADMIN</TableCell>
                      <TableCell>Can manage users, adjust sequences, modify settings, void payments, and override pricing.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold text-slate-600">MANAGER</TableCell>
                      <TableCell>Can create/edit Work Orders, accept Payments, and manage Inventory. Cannot alter global settings.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold text-muted-foreground">STAFF</TableCell>
                      <TableCell>Can view Work Orders, mark steps as complete, and add notes. Cannot see financial totals or delete records.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">{safeFormatDate(user.createdAt, "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(v) => updateUserRole(user.id, v ?? "STAFF")}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER">OWNER</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="MANAGER">MANAGER</SelectItem>
                              <SelectItem value="STAFF">STAFF</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditUserName(user.name);
                              setEditUserEmail(user.email);
                              setEditingUser(user);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border border-border lg:col-span-1">
              <CardHeader>
                <CardTitle>Generate Invite Link</CardTitle>
                <CardDescription>Create a sign-up link for a new employee.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="staff@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={v => setInviteRole(v ?? "STAFF")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">STAFF</SelectItem>
                      <SelectItem value="MANAGER">MANAGER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createInvitation} className="w-full">Create Invite Link</Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No active invitations.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map(inv => {
                        const link = `${window.location.origin}/auth/invite/${inv.token}`;
                        const invDate = new Date(inv.expiresAt);
                        const isExpired = isValid(invDate) && invDate < new Date();
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.email}</TableCell>
                            <TableCell><Badge variant="secondary">{inv.role}</Badge></TableCell>
                            <TableCell>
                              {isExpired ? <Badge variant="destructive">Expired</Badge> : <Badge variant="outline">Pending</Badge>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{safeFormatDate(inv.expiresAt, "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => {
                                navigator.clipboard.writeText(link);
                                toast.success("Invite link copied to clipboard!");
                              }}>
                                <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => revokeInvitation(inv.id)}>
                                <Trash className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="numbering">
          <Card className="max-w-3xl shadow-sm border border-border">
            <CardHeader>
              <CardTitle>Sequence Management</CardTitle>
              <CardDescription>Adjust the starting numbers for various documents. Sequences can only be moved forward.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Last Used Number</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.map(seq => (
                      <TableRow key={seq.id}>
                        <TableCell className="font-medium">{seq.type}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue={seq.lastValue} 
                            min={seq.lastValue}
                            className="w-32"
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (val > seq.lastValue) updateSequence(seq.id, val);
                              else e.target.value = seq.lastValue.toString();
                            }} 
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          Edit box and blur to save. Next generated document will be #{seq.lastValue + 1}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sequences.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No sequences found yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing">
          <Card className="max-w-2xl shadow-sm border border-border">
            <CardHeader>
              <CardTitle>Printing Layout Settings</CardTitle>
              <CardDescription>Configure how physical documents look.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Company Logo</Label>
                  <p className="text-xs text-muted-foreground">If uploaded in General Settings</p>
                </div>
                <Switch checked={sPrinting.PRINT_LOGO === "true"} onCheckedChange={(c) => setSPrinting({...sPrinting, PRINT_LOGO: String(c)})} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Tax Details</Label>
                  <p className="text-xs text-muted-foreground">Display tax breakdowns on invoices</p>
                </div>
                <Switch checked={sPrinting.PRINT_TAX === "true"} onCheckedChange={(c) => setSPrinting({...sPrinting, PRINT_TAX: String(c)})} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Customer Balance</Label>
                  <p className="text-xs text-muted-foreground">Display current running balance at the bottom</p>
                </div>
                <Switch checked={sPrinting.PRINT_BALANCE === "true"} onCheckedChange={(c) => setSPrinting({...sPrinting, PRINT_BALANCE: String(c)})} />
              </div>
              <div className="space-y-2">
                <Label>Default Paper Size</Label>
                <Select value={sPrinting.PRINT_PAPER_SIZE} onValueChange={v => setSPrinting({...sPrinting, PRINT_PAPER_SIZE: v ?? "A4"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (Standard)</SelectItem>
                    <SelectItem value="LETTER">US Letter</SelectItem>
                    <SelectItem value="THERMAL_80">Thermal Receipt (80mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Print Footer Text</Label>
                <Textarea value={sPrinting.PRINT_FOOTER} onChange={e => setSPrinting({...sPrinting, PRINT_FOOTER: e.target.value})} rows={2} />
              </div>
              <Button onClick={() => saveSettingsGroup(sPrinting)} disabled={saving} className="w-full">Save Printing Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card className="max-w-2xl shadow-sm border border-border">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-xl mx-auto flex items-center justify-center text-white font-black text-2xl">
                B
              </div>
              <h2 className="text-2xl font-bold">BillFlow ERP</h2>
              <p className="text-muted-foreground">Version 1.0.0 (Phase 5 Production Build)</p>
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-2 max-w-md mx-auto text-left border">
                <p>✔ Inventory & Square Foot Engine</p>
                <p>✔ Dynamic Work Orders & Timeline</p>
                <p>✔ Ledger & Payment Allocation</p>
                <p>✔ Core Administration</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update the user's name and email address. Note that changing the email address might affect their ability to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={editUserName} 
                onChange={(e) => setEditUserName(e.target.value)} 
                placeholder="User's full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={editUserEmail} 
                onChange={(e) => setEditUserEmail(e.target.value)} 
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={updateUserDetails} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
