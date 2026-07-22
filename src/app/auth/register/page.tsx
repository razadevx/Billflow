"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    userName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      toast.success("Account created successfully! Logging you in...");
      
      const signInRes = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (signInRes.error) {
        toast.error("Failed to auto-login. Please log in manually.");
        router.push("/auth/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-[#222] bg-[#121212] text-white shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Create an account</CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Enter your company details to get started
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium text-zinc-200">Company Name</Label>
            <Input 
              id="companyName" 
              placeholder="Acme Corp" 
              value={formData.companyName}
              onChange={handleChange}
              className="h-10 rounded-lg border-transparent bg-[#1e2330] px-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:bg-[#1e2330] focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-medium text-zinc-200">Your Name</Label>
            <Input 
              id="userName" 
              placeholder="John Doe" 
              value={formData.userName}
              onChange={handleChange}
              className="h-10 rounded-lg border-transparent bg-[#1e2330] px-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:bg-[#1e2330] focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-200">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={formData.email}
              onChange={handleChange}
              className="h-10 rounded-lg border-transparent bg-[#1e2330] px-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:bg-[#1e2330] focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-200">Password</Label>
            <Input 
              id="password" 
              type="password"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              className="h-10 rounded-lg border-transparent bg-[#1e2330] px-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:bg-[#1e2330] focus:ring-1 focus:ring-blue-500"
              required 
              minLength={8}
            />
          </div>

          <Button type="submit" className="mt-2 w-full bg-blue-500 text-white hover:bg-blue-600 h-10 rounded-lg font-medium transition-colors" disabled={loading}>
            {loading ? <Icons.loader className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Account
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center pb-6">
        <div className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
