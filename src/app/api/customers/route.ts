import { getRequestContext } from "@/server/core/context";
import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/domain/customer/services/CustomerService";
import { CreateCustomerSchema } from "@/domain/customer/validation/CustomerValidation";
import { RequestContext } from "@/server/core/RequestContext";
import { successResponse, errorResponse } from "@/server/api/response";
import { CustomerRepository } from "@/domain/customer/repository/CustomerRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TODO: Replace with real auth middleware
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const repo = new CustomerRepository();
    const customers = await repo.findManyWithCredit(context.companyId);
    
    return successResponse(customers);
  } catch (error) {
    return errorResponse("Failed to fetch customers", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const body = await request.json();
    
    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid input", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const service = new CustomerService(context);
    const result = await service.createCustomer(parsed.data);
    
    if (result.isSuccess()) {
      return successResponse(result.value, 201);
    } else {
      return NextResponse.json(errorResponse(result.error.message, "BAD_REQUEST"), { status: 400 });
    }
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create customer", "INTERNAL_ERROR", 500);
  }
}
