"use client";

import React from "react";
import { DashboardContainer } from "@/components/layout/DashboardContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { InvoiceStatus } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data: invoice, isLoading: loading } = useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/invoices/${id}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json().then(json => json.data);
    }
  });

  const { data: adminData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const [companyRes, settingsRes] = await Promise.all([
        fetch("/api/v1/administration/company"),
        fetch("/api/v1/administration/settings")
      ]);
      const company = companyRes.ok ? await companyRes.json() : null;
      const settings = settingsRes.ok ? await settingsRes.json() : [];
      return { company, settings: Array.isArray(settings) ? settings : [] };
    }
  });

  const company = adminData?.company;
  const settings = adminData?.settings || [];
  const getSetting = (key: string, defaultVal: string) => settings.find((s: any) => s.key === key)?.value ?? defaultVal;

  const companyLogo = getSetting("COMPANY_LOGO", "");
  const printLogo = getSetting("PRINT_LOGO", "true") === "true";
  const printFooter = getSetting("PRINT_FOOTER", "Thank you for your business!");

  const handleUpdateStatus = async (status: InvoiceStatus) => {
    try {
      const res = await fetch(`/api/v1/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["khata"] });
      toast.success("Invoice status updated to " + status);
    } catch (err) {
      toast.error("Could not update status");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const publicLink = `${window.location.origin}/share/invoice/${invoice.id}`;
    const text = `Hello ${invoice.customer.name},\n\nHere is your invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}.\n\nYou can view and download it here: ${publicLink}\n\nThank you!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  if (loading) {
    return (
      <DashboardContainer className="py-8">
        <div className="flex justify-center p-12">
          <Icons.loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardContainer>
    );
  }

  if (!invoice) {
    return (
      <DashboardContainer className="py-8">
        <div className="text-center p-12 bg-card rounded-xl border">
          <p className="text-muted-foreground">Invoice not found.</p>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer className="py-8 max-w-4xl print:p-0 print:py-0">
      
      {/* Top Actions Bar (Hidden on Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/invoices")}>
            <Icons.chevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge variant="info">{invoice.status}</StatusBadge>
              <span className="text-sm text-muted-foreground">
                Issued on {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "DRAFT" && (
            <Button variant="outline" onClick={() => handleUpdateStatus("ISSUED")}>
              Mark as Issued
            </Button>
          )}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Button
              variant="outline"
              onClick={() => router.push(`/payments/new?customerId=${invoice.customerId}&invoiceId=${invoice.id}&amount=${invoice.balanceDue || invoice.total}`)}
            >
              Receive Payment
            </Button>
          )}
          {invoice.workOrderId && (
            <Button variant="outline" onClick={() => router.push(`/workorders/${invoice.workOrderId}`)}>
              Work Order
            </Button>
          )}
          <Button variant="secondary" onClick={handlePrint}>
            <Icons.report className="h-4 w-4 mr-2" /> Print / PDF
          </Button>
          <Button onClick={handleWhatsAppShare} className="bg-green-600 hover:bg-green-700 text-white">
            <Icons.phone className="h-4 w-4 mr-2" /> WhatsApp Share
          </Button>
        </div>
      </div>

      {/* A4 Document Layout */}
      <div className="bg-white text-black p-8 sm:p-12 border rounded-xl shadow-sm print:shadow-none print:border-0 print:m-0 print:p-0 w-full min-h-[1056px] relative flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter text-gray-900">INVOICE</h2>
              <p className="text-gray-500 font-mono text-sm mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right space-y-0.5">
              {printLogo && companyLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companyLogo} alt="Company Logo" className="h-12 object-contain ml-auto mb-2" />
              )}
              <div className="text-xl font-bold text-gray-900 tracking-tight">
                {company?.name || "BillFlow Printing"}
              </div>
              {company?.address && <p className="text-sm text-gray-500">{company.address}</p>}
              {company?.phone && <p className="text-sm text-gray-500">Ph: {company.phone}</p>}
              {company?.email && <p className="text-sm text-gray-500">{company.email}</p>}
              {company?.taxId && <p className="text-sm text-gray-500 font-mono">Tax ID / GST: {company.taxId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
              <p className="font-semibold text-gray-900 text-lg">{invoice.customer?.name || "Customer"}</p>
              {invoice.customer?.address && <p className="text-sm text-gray-600 mt-1">{invoice.customer.address}</p>}
              {invoice.customer?.phone && <p className="text-sm text-gray-600">{invoice.customer.phone}</p>}
              {invoice.customer?.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
            </div>
            <div className="text-right space-y-2">
              <div className="flex justify-end gap-8">
                <span className="text-sm text-gray-500">Issue Date</span>
                <span className="text-sm font-medium text-gray-900">{new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-end gap-8">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="text-sm font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-end gap-8 pt-4">
                <span className="text-sm font-semibold text-gray-900">Total Due</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="py-3 text-right font-semibold text-gray-600 w-24">Qty</th>
                <th className="py-3 text-right font-semibold text-gray-600 w-32">Price</th>
                <th className="py-3 text-right font-semibold text-gray-600 w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.workOrder?.lineItems?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-4 text-gray-800">{item.description}</td>
                  <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-right font-medium text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
              {(!invoice.workOrder || !invoice.workOrder.lineItems || invoice.workOrder.lineItems.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                    Flat invoice details for {invoice.invoiceNumber}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="flex justify-end mb-12">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.payments?.length > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Amount Paid</span>
                  <span>-{formatCurrency(invoice.total - invoice.balanceDue)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-gray-900 pt-3 border-t border-gray-200">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes & Dynamic Printing Footer */}
        <div className="pt-6 border-t border-gray-100 space-y-4">
          {invoice.notes && (
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Notes: </span>
              {invoice.notes}
            </div>
          )}
          {invoice.terms && (
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Terms & Conditions: </span>
              {invoice.terms}
            </div>
          )}
          {printFooter && (
            <p className="text-center text-xs text-gray-400 font-medium tracking-wide">
              {printFooter}
            </p>
          )}
        </div>

      </div>
    </DashboardContainer>
  );
}
