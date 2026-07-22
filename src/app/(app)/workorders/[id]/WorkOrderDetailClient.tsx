"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, AlertTriangle, FileText, CheckCircle, Upload, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

export default function WorkOrderDetailClient({ idPromise }: { idPromise: Promise<{ id: string }> }) {
  const params = use(idPromise);
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const { data: wo, isLoading, isError } = useQuery({
    queryKey: ["workorder", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/workorders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch work order");
      return res.json();
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ granularStatus, prismaStatus }: { granularStatus: string, prismaStatus: string }) => {
      const res = await fetch(`/api/v1/workorders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granularStatus, prismaStatus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["workorder", id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const noteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/workorders/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add note");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Note added");
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["workorder", id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/workorders/${id}/invoice`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate invoice");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Invoice generated");
      queryClient.invalidateQueries({ queryKey: ["workorder", id] });
      router.push(`/invoices/${data.id}`);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const attachmentMutation = useMutation({
    mutationFn: async () => {
      // Mock upload for Phase 5
      const mockAttachment = {
        fileName: "design_proof_v1.pdf",
        fileUrl: `/uploads/${Date.now()}_design_proof.pdf`,
        fileSize: 1024 * 500, // 500 KB
        mimeType: "application/pdf"
      };

      const res = await fetch(`/api/v1/workorders/${id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockAttachment)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Attachment uploaded");
      queryClient.invalidateQueries({ queryKey: ["workorder", id] });
    },
    onError: (err: any) => toast.error(err.message)
  });


  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading work order...</div>;
  if (isError || !wo) return <div className="p-8 text-center text-red-500 flex items-center justify-center"><AlertTriangle className="mr-2" /> Error loading work order.</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "IN_PROGRESS": return <Badge variant="outline" className="bg-blue-50 text-blue-700">In Progress</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case "DELIVERED": return <Badge variant="outline" className="bg-purple-50 text-purple-700">Delivered</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-red-700">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/workorders" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{wo.title}</h2>
            <p className="text-sm text-muted-foreground">Order #{wo.orderNumber} • {wo.customer?.name}</p>
          </div>
          <div className="ml-4">{getStatusBadge(wo.status)}</div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push(`/workorders/${wo.id}/print`)}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/payments/new?customerId=${wo.customerId}&workOrderId=${wo.id}&amount=${wo.total}`)}
          >
            Receive Payment
          </Button>
          
          {wo.invoices?.length === 0 && (
             <Button variant="outline" onClick={() => invoiceMutation.mutate()} disabled={invoiceMutation.isPending}>
               <FileText className="mr-2 h-4 w-4" /> Generate Invoice
             </Button>
          )}

          {wo.status === "PENDING" && (
            <Button onClick={() => statusMutation.mutate({ granularStatus: "Design Started", prismaStatus: "PENDING" })} disabled={statusMutation.isPending}>
              Start Design
            </Button>
          )}
          {wo.status === "PENDING" && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => statusMutation.mutate({ granularStatus: "Production Started", prismaStatus: "IN_PROGRESS" })} disabled={statusMutation.isPending}>
              Start Production
            </Button>
          )}
          {wo.status === "IN_PROGRESS" && (
            <>
              <Button variant="outline" onClick={() => statusMutation.mutate({ granularStatus: "Printing", prismaStatus: "IN_PROGRESS" })}>
                Set: Printing
              </Button>
              <Button variant="outline" onClick={() => statusMutation.mutate({ granularStatus: "Finishing", prismaStatus: "IN_PROGRESS" })}>
                Set: Finishing
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => statusMutation.mutate({ granularStatus: "Ready for Pickup", prismaStatus: "COMPLETED" })} disabled={statusMutation.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" /> Complete Order
              </Button>
            </>
          )}
          {wo.status === "COMPLETED" && (
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => statusMutation.mutate({ granularStatus: "Delivered to Customer", prismaStatus: "DELIVERED" })} disabled={statusMutation.isPending}>
              Mark Delivered
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>Description:</strong> {wo.description || "N/A"}</p>
                <p className="mt-2"><strong>Created:</strong> {format(new Date(wo.createdAt), "PPP")}</p>
                {wo.expectedDate && <p><strong>Expected:</strong> {format(new Date(wo.expectedDate), "PPP")}</p>}
                <p><strong>Inventory Status:</strong> {wo.inventoryStatus}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items (Square Foot Engine)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Description</th>
                      <th className="p-3 text-right font-medium">Qty</th>
                      <th className="p-3 text-right font-medium">Unit Price/Rate</th>
                      <th className="p-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wo.lineItems.map((li: any) => (
                      <tr key={li.id} className="border-b">
                        <td className="p-3">
                          {li.description}
                        </td>
                        <td className="p-3 text-right">{li.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(li.unitPrice)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(li.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <div className="w-48 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(wo.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(wo.tax)}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 text-primary"><span>Total:</span><span>{formatCurrency(wo.total)}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {wo.activityLogs?.map((log: any, i: number) => {
                  let parsedDetails = {};
                  try {
                    parsedDetails = JSON.parse(log.details || "{}");
                  } catch (e) {}
                  
                  return (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900">{log.action.replace(/_/g, " ")}</div>
                          <time className="text-xs font-medium text-indigo-500">{format(new Date(log.createdAt), "MMM d, h:mm a")}</time>
                        </div>
                        <div className="text-sm text-slate-500">
                           {(parsedDetails as any).granularStatus || (parsedDetails as any).status || log.action}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Side actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Upload design proofs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full border-dashed" onClick={() => attachmentMutation.mutate()} disabled={attachmentMutation.isPending}>
                <Upload className="mr-2 h-4 w-4" /> {attachmentMutation.isPending ? "Uploading..." : "Upload Mock File"}
              </Button>

              <div className="space-y-2 mt-4">
                {wo.attachments?.map((att: any) => (
                  <div key={att.id} className="flex items-center justify-between p-2 border rounded text-sm bg-slate-50">
                    <div className="flex items-center overflow-hidden">
                      <Paperclip className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{att.fileName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {Math.round(att.fileSize / 1024)} KB
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wo.invoices?.length > 0 ? (
                wo.invoices.map((inv: any) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block p-3 border rounded hover:bg-slate-50 text-sm">
                    <div className="font-medium text-blue-600">Invoice #{inv.invoiceNumber}</div>
                    <div className="text-muted-foreground mt-1">{formatCurrency(inv.total)} • {inv.status}</div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No invoices generated.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <Button size="sm" onClick={() => noteMutation.mutate()} disabled={!noteText.trim() || noteMutation.isPending}>Add Note</Button>
              </div>

              <div className="space-y-4 mt-6">
                {wo.notes?.map((note: any) => (
                  <div key={note.id} className="p-3 bg-muted rounded-md text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {note.user?.name || "User"} • {format(new Date(note.createdAt), "MMM d, h:mm a")}
                    </p>
                    <p>{note.text}</p>
                  </div>
                ))}
                {wo.notes?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
