import React from "react";
import { InvitationService } from "@/server/services/InvitationService";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth"; // Need Better Auth
import { headers } from "next/headers";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  let invitation = null;
  let error = null;

  try {
    invitation = await InvitationService.validateToken(token);
  } catch (err: any) {
    error = err.message;
  }

  if (error || !invitation) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Invalid Invitation</CardTitle>
            <CardDescription>{error || "This invitation is invalid or has expired."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const acceptInvite = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    
    // Register user using better-auth
    const headersList = await headers();
    try {
      await auth.api.signUpEmail({
        body: {
          email: invitation.email,
          password,
          name,
          companyId: invitation.companyId,
          role: invitation.role
        } as any,
        headers: headersList
      });
      
      // Mark as accepted
      await InvitationService.acceptInvitation(token);
    } catch (e) {
      console.error(e);
      // Fallback
    }

    redirect("/dashboard");
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invitation.company.name}</CardTitle>
          <CardDescription>
            You have been invited to join {invitation.company.name} as a {invitation.role}.
            Create a password to accept the invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={acceptInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={invitation.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="name" required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Accept Invitation</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
