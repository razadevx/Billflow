"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { fetchReportData } from "./actions";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState({ page: 1, limit: 10, startDate: "", endDate: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReportData(activeTab, {
        page: filter.page,
        limit: filter.limit,
        startDate: filter.startDate ? new Date(filter.startDate) : undefined,
        endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportCSV = () => {
    if (!data?.data || data.data.length === 0) return;
    const headers = Object.keys(data.data[0]).join(",");
    const rows = data.data.map((row: any) => 
      Object.values(row).map(val => `"${val}"`).join(",")
    ).join("\\n");
    const csv = `${headers}\\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_report.csv`;
    a.click();
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center print:hidden">
        <PageHeader title="Reports Dashboard" description="View business analytics, financial statements, and exports." />
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition">
            <Download size={18} /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-lg shadow-primary/20">
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border print:hidden overflow-x-auto pb-2">
        {["sales", "payments", "statements", "inventory", "cash"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize whitespace-nowrap font-medium transition-all border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-4 print:hidden bg-card p-4 rounded-xl border shadow-sm items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Start Date</label>
          <input type="date" className="bg-background border rounded-lg px-3 py-2 text-sm" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">End Date</label>
          <input type="date" className="bg-background border rounded-lg px-3 py-2 text-sm" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading {activeTab} data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
            <AlertCircle className="mb-4" size={32} />
            <p>{error}</p>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <FileText className="mb-4 opacity-50" size={32} />
            <p>No records found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground">
                <tr>
                  {data?.data[0] && Object.keys(data.data[0]).map(key => (
                    <th key={key} className="px-6 py-4">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((row: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-6 py-4">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && !loading && (
        <div className="flex justify-between items-center print:hidden bg-card p-4 rounded-xl border shadow-sm">
          <button 
            disabled={filter.page === 1} 
            onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-muted transition"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {filter.page} of {data.totalPages}
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
  );
}
