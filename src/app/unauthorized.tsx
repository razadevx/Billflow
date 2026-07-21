"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Icons.dashboard className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold mb-2">401</h1>
      <p className="text-xl text-muted-foreground mb-8">You are not authorized to view this page.</p>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button onClick={() => router.push("/auth/login")}>
          Sign In
        </Button>
      </div>
    </div>
  );
}
