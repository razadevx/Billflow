"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Icons.dashboard className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-4xl font-bold mb-2">500</h1>
      <p className="text-xl text-muted-foreground mb-8">Something went wrong.</p>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => reset()}>
          Try Again
        </Button>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
