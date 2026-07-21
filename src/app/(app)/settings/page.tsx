"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type User = { id: string; name: string; email: string; role: string; createdAt: string };
type Setting = { id: string; key: string; value: string };

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings Form State
  const [taxRate, setTaxRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [featureFlags, setFeatureFlags] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [usersRes, settingsRes] = await Promise.all([
          fetch("/api/v1/administration/users"),
          fetch("/api/v1/administration/settings")
        ]);

        if (!usersRes.ok || !settingsRes.ok) throw new Error("Failed to load data");

        const usersData = await usersRes.json();
        const settingsData = await settingsRes.json();

        setUsers(usersData);
        setSettings(settingsData);

        const tr = settingsData.find((s: Setting) => s.key === "TAX_RATE")?.value || "";
        const cr = settingsData.find((s: Setting) => s.key === "CURRENCY")?.value || "USD";
        const ff = settingsData.find((s: Setting) => s.key === "FEATURE_FLAGS")?.value || "";
        
        setTaxRate(tr);
        setCurrency(cr);
        setFeatureFlags(ff);

      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const saveSettings = async () => {
    try {
      await Promise.all([
        fetch("/api/v1/administration/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "TAX_RATE", value: taxRate })
        }),
        fetch("/api/v1/administration/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "CURRENCY", value: currency })
        }),
        fetch("/api/v1/administration/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "FEATURE_FLAGS", value: featureFlags })
        })
      ]);
      alert("Settings saved successfully");
    } catch (err) {
      alert("Failed to save settings");
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/v1/administration/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (!res.ok) throw new Error("Failed to update user");
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Failed to update role");
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
          <h3 className="text-xl font-bold mb-2">Error Loading Settings</h3>
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Administration" description="Manage company settings, users, and roles." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Card */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Configure global application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Global Tax Rate (%)</Label>
              <Input 
                id="taxRate" 
                value={taxRate} 
                onChange={(e) => setTaxRate(e.target.value)} 
                placeholder="e.g. 18" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Input 
                id="currency" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                placeholder="e.g. USD, INR" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="featureFlags">Feature Flags (JSON)</Label>
              <Input 
                id="featureFlags" 
                value={featureFlags} 
                onChange={(e) => setFeatureFlags(e.target.value)} 
                placeholder='{"newDashboard": true}' 
              />
            </div>
            <Button onClick={saveSettings} className="w-full">Save Settings</Button>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle>Profile Management</CardTitle>
            <CardDescription>Manage your personal profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground flex items-center justify-center h-32">
                Profile details loaded from current session.
             </div>
             <Button variant="outline" className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>
      </div>

      {/* Users Card */}
      <Card className="shadow-sm border border-border mt-6">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage application users and roles</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <select 
                        className="text-sm border rounded p-1 mr-2 bg-background"
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                      >
                        <option value="STAFF">STAFF</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
