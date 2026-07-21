import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { format } from "date-fns";
import { getRequestContext } from "@/server/core/context";
import { Printer } from "lucide-react";

export default async function PrintWorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
  if (!ctx) return notFound();

  const { id } = await params;

  const wo = await db.workOrder.findUnique({
    where: { id, companyId: ctx.companyId },
    include: {
      customer: true,
      lineItems: true,
      company: true
    }
  });

  if (!wo) return notFound();

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Print Button (Hidden when printing) */}
      <div className="print:hidden p-4 bg-slate-100 flex justify-between items-center border-b">
        <div>
          <h1 className="font-bold">Print Work Order</h1>
          <p className="text-sm text-slate-500">Press Ctrl+P or Cmd+P to print</p>
        </div>
        <button 
          id="print-btn" 
          className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center hover:bg-blue-700 transition"
        >
          <Printer className="w-4 h-4 mr-2" /> Print Now
        </button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{wo.company?.name || "BILLFLOW"}</h1>
            <p className="text-sm mt-1">{wo.company?.address || "Company Address"}</p>
            <p className="text-sm">{wo.company?.phone || "Phone"} • {wo.company?.email || "Email"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-slate-200">WORK ORDER</h2>
            <p className="text-lg font-bold mt-2">WO #{wo.orderNumber}</p>
            <p className="text-sm">Date: {format(new Date(wo.createdAt), "MMM dd, yyyy")}</p>
            <p className="text-sm">Expected: {wo.expectedDate ? format(new Date(wo.expectedDate), "MMM dd, yyyy") : "TBD"}</p>
          </div>
        </div>

        {/* Customer & Job Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Customer Details</h3>
            <p className="font-bold text-lg">{wo.customer?.name}</p>
            <p>{wo.customer?.phone || "No phone"}</p>
            <p>{wo.customer?.email || "No email"}</p>
            {wo.customer?.address && <p>{wo.customer?.address}</p>}
          </div>
          <div>
            <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Job Information</h3>
            <p><strong>Title:</strong> {wo.title}</p>
            <p><strong>Status:</strong> {wo.status}</p>
            {wo.description && <p><strong>Notes:</strong> {wo.description}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 px-2 font-bold uppercase text-sm">Description (Material & Dimensions)</th>
                <th className="py-3 px-2 font-bold uppercase text-sm text-right">Qty</th>
                <th className="py-3 px-2 font-bold uppercase text-sm text-right">Unit Price/Rate</th>
                <th className="py-3 px-2 font-bold uppercase text-sm text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {wo.lineItems.map((li) => (
                <tr key={li.id} className="border-b border-slate-200">
                  <td className="py-3 px-2 font-medium">{li.description}</td>
                  <td className="py-3 px-2 text-right">{li.quantity}</td>
                  <td className="py-3 px-2 text-right">${li.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-bold">${li.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span className="font-bold text-slate-500">Subtotal:</span>
              <span>${wo.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-bold text-slate-500">Tax:</span>
              <span>${wo.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-b-2 border-black">
              <span className="font-black text-xl">Total:</span>
              <span className="font-black text-xl">${wo.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-24">
          <div>
            <div className="border-t border-black pt-2">
              <p className="font-bold text-sm text-center">Authorized Signature</p>
            </div>
          </div>
          <div>
            <div className="border-t border-black pt-2">
              <p className="font-bold text-sm text-center">Customer Acceptance</p>
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.querySelector('button').addEventListener('click', function() {
                window.print();
              });
            `
          }}
        />
      </div>
    </div>
  );
}
