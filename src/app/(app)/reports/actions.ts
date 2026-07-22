"use server";

import { getRequestContext } from "@/server/core/context";
import { ReportService, ReportFilter } from "@/domain/report/report.service";

export async function fetchReportData(type: string, filter: ReportFilter) {
  const ctx = await getRequestContext();
  if (!ctx) throw new Error("Unauthorized");
  
  const service = new ReportService(ctx);
  
  let result;
  switch (type) {
    case "executive":
      result = await service.getExecutiveDashboard();
      break;
    case "sales":
      result = await service.getSalesReport(filter);
      break;
    case "payments":
      result = await service.getPaymentsReport(filter);
      break;
    case "statements":
      result = await service.getCustomerStatements(filter);
      break;
    case "inventory":
      result = await service.getInventoryReport(filter);
      break;
    case "cash":
      result = await service.getDailyCashReport(filter);
      break;
    case "workorders":
      result = await service.getWorkOrderReport(filter);
      break;
    case "squarefeet":
      result = await service.getSquareFootReport(filter);
      break;
    case "customers":
      result = await service.getCustomerReport(filter);
      break;
    default:
      throw new Error("Invalid report type: " + type);
  }
  
  if (result.isSuccess()) {
    return result.value;
  } else {
    throw new Error(result.error.message);
  }
}
