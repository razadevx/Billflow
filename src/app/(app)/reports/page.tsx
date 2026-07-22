"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { fetchReportData } from "./actions";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const TABS = [
  { id: "executive", label: "Executive Dashboard" },
  { id: "sales", label: "Revenue" },
  { id: "payments", label: "Payments" },
  { id: "statements", label: "Statements" },
  { id: "cash", label: "Daily Cash" },
  { id: "workorders", label: "Work Orders" },
  { id: "squarefeet", label: "Square Feet" },
  { id: "customers", label: "Customers" },
  { id: "inventory", label: "Inventory" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("executive");
  const [filter, setFilter] = useState({ page: 1, limit: 10, startDate: "", endDate: "" });
  const [exporting, setExporting] = useState(false);
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["reports", activeTab, filter],
    queryFn: async () => {
      return await fetchReportData(activeTab, {
        page: filter.page,
        limit: filter.limit,
        startDate: filter.startDate ? new Date(filter.startDate) : undefined,
        endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      });
    }
  });

  // When changing tabs, reset page to 1
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setFilter(prev => ({ ...prev, page: 1 }));
  };

  const exportCSV = async () => {
    if (activeTab === "executive") return; // Executive doesn't have CSV
    
    setExporting(true);
    try {
      // Fetch full dataset for export (up to 5000 rows)
      const res = await fetchReportData(activeTab, {
        startDate: filter.startDate ? new Date(filter.startDate) : undefined,
        endDate: filter.endDate ? new Date(filter.endDate) : undefined,
        export: true,
      });

      const exportData = res.data;
      if (!exportData || exportData.length === 0) return;

      const headers = Object.keys(exportData[0]).join(",");
      const rows = exportData.map((row: any) => 
        Object.values(row).map(val => {
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      ).join("\n");
      
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = () => {
    window.print();
  };

  const renderExecutiveDashboard = () => {
    if (!data) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(data.totalRevenue || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payments Received</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(data.paymentsReceived || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(data.outstandingReceivables || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Work Orders</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.activeWorkOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed Work Orders</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.completedWorkOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(data.inventoryValue || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{data.lowStockItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.activeCustomers}</div></CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 print:hidden">
        <PageHeader title="Reports" description="View business analytics, financial statements, and export data." />
        <div className="flex gap-3">
          {activeTab !== "executive" && (
            <button disabled={exporting} onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition disabled:opacity-50">
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          )}
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm">
            <FileText size={18} /> Print / PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border print:hidden overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 text-sm whitespace-nowrap font-medium transition-all rounded-t-lg ${activeTab === tab.id ? "bg-card border border-b-0 text-primary shadow-sm" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "executive" && (
        <div className="flex gap-4 print:hidden bg-card p-4 rounded-xl border shadow-sm items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Start Date</label>
            <input type="date" className="bg-background border rounded-lg px-3 py-2 text-sm" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">End Date</label>
            <input type="date" className="bg-background border rounded-lg px-3 py-2 text-sm" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-card rounded-xl border">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Loading report data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-destructive">
          <AlertCircle className="mb-4" size={32} />
          <p>{error?.message || "An error occurred"}</p>
        </div>
      ) : activeTab === "executive" ? (
        renderExecutiveDashboard()
      ) : (
        <div className="space-y-4">
          {data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(data.summary).map(([key, val]) => (
                <Card key={key}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle></CardHeader>
                  <CardContent><div className="text-xl font-bold">{typeof val === 'number' && key.toLowerCase().includes('total') && !key.toLowerCase().includes('sqft') ? formatCurrency(val) : String(val)}</div></CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            {!data?.data || data.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <FileText className="mb-4 opacity-50" size={32} />
                <p>No records found for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      {Object.keys(data.data[0]).filter(k => k !== 'id').map(key => (
                        <th key={key} className="px-6 py-4">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((row: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        {Object.entries(row).filter(([k]) => k !== 'id').map(([k, val]: [string, any], j: number) => {
                          let displayVal = String(val);
                          if (val === null || val === undefined) displayVal = '-';
                          else if (typeof val === 'boolean') displayVal = val ? 'Yes' : 'No';
                          else if (typeof val === 'object') displayVal = JSON.stringify(val);
                          else if (typeof val === 'number' && (k.toLowerCase().includes('price') || k.toLowerCase().includes('revenue') || k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('valuation') || k.toLowerCase().includes('outstanding'))) {
                            if (!k.toLowerCase().includes('sqft') && !k.toLowerCase().includes('orders')) {
                              displayVal = formatCurrency(val);
                            }
                          }
                          else if (k.toLowerCase().includes('date') || k.toLowerCase().includes('createdat')) {
                            displayVal = format(new Date(val), 'MMM d, yyyy');
                          }
                          
                          return (
                            <td key={j} className="px-6 py-4 whitespace-nowrap">
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center print:hidden bg-card p-4 rounded-xl border shadow-sm mt-4">
              <button 
                disabled={filter.page === 1} 
                onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-muted transition"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {filter.page} of {data.totalPages} <span className="opacity-50 ml-2">({data.total} total records)</span>
              </span>
              <button 
                disabled={filter.page === data.totalPages} 
                onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-muted transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .bg-card { border: none !important; box-shadow: none !important; background: transparent !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background-color: #f8f9fa; font-weight: bold; }
          @page { size: landscape; margin: 1cm; }
        }
      `}} />
    </div>
  );
}
