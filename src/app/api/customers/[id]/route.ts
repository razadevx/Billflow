import { getRequestContext } from "@/server/core/context";
import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/domain/customer/services/CustomerService";
import { UpdateCustomerSchema } from "@/domain/customer/validation/CustomerValidation";
import { RequestContext } from "@/server/core/RequestContext";
import { successResponse, errorResponse } from "@/server/api/response";
import { CustomerRepository } from "@/domain/customer/repository/CustomerRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const repo = new CustomerRepository();
    
    const customer = await repo.findById(params.id, context.companyId);
    
    if (!customer) {
      return errorResponse("Customer not found", "NOT_FOUND", 404);
    }

    return successResponse(customer);
  } catch (error) {
    return errorResponse("Failed to fetch customer", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const body = await request.json();
    
    const parsed = UpdateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid input", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const service = new CustomerService(context);
    const result = await service.updateCustomer(params.id, parsed.data);

    if (result.isSuccess()) {
      return successResponse(result.value);
    } else {
      return NextResponse.json(errorResponse(result.error.message, "BAD_REQUEST"), { status: 400 });
    }
  } catch (error) {
    return errorResponse("Failed to update customer", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    
    const service = new CustomerService(context);
    const result = await service.archiveCustomer(params.id);

    if (result.isSuccess()) {
      return successResponse(result.value);
    } else {
      return NextResponse.json(errorResponse(result.error.message, "BAD_REQUEST"), { status: 400 });
    }
  } catch (error) {
    return errorResponse("Failed to archive customer", "INTERNAL_ERROR", 500);
  }
}
