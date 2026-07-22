"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in");
        setLoading(false);
        return;
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-[#222] bg-[#121212] text-white shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Enter your email and password to sign in
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-200">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border-transparent bg-[#1e2330] px-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:bg-[#1e2330] focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-200">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg border-transparent bg-[#1e2330] px-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:bg-[#1e2330] focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>

          <Button type="submit" className="mt-2 w-full bg-blue-500 text-white hover:bg-blue-600 h-10 rounded-lg font-medium transition-colors" disabled={loading}>
            {loading ? <Icons.loader className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center pb-6">
        <div className="text-center text-sm text-zinc-400">
          Don't have an account?{" "}
          <Link href="/auth/register" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
            Register here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
