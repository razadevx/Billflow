import "dotenv/config";
import { WorkOrderService } from "./src/domain/workorder/workorder.service";
import { db as prisma } from "./src/server/db";

async function run() {
  const company = await prisma.company.findFirst();
  const customer = await prisma.customer.findFirst({ where: { companyId: company.id } });
  const user = await prisma.user.findFirst();
  
  if (!customer || !user) {
    console.log("No customer or user found");
    return;
  }

  const ctx = { companyId: company.id, userId: user.id, role: "OWNER" } as any;
  const service = new WorkOrderService(ctx);

  const dto = {
    customerId: customer.id,
    title: "Test Work Order",
    description: "Testing creation",
    priority: 0,
    lineItems: [
      {
        description: "Test Item",
        quantity: 1,
        unitPrice: 100,
        taxRate: 0,
        isSqFt: false
      }
    ]
  };

  const result = await service.createWorkOrder(dto as any);
  if (result.isFailure()) {
    console.error("FAILED:", result.error);
  } else {
    console.log("SUCCESS:", result.value.id);
  }
}

run().catch(console.error);
