import { BaseService } from "@/server/core/BaseService";
import { CustomerRepository } from "../repository/CustomerRepository";
import { RequestContext } from "@/server/core/RequestContext";
import { Result, success, failure } from "@/server/core/Result";
import { CreateCustomerInput, UpdateCustomerInput } from "../validation/CustomerValidation";
import { db as prisma, TransactionManager } from "@/server/db";
import { Customer, Prisma } from "@prisma/client";
import { eventBus } from "@/server/events/InMemoryEventBus";

export class CustomerService extends BaseService {
  private repo: CustomerRepository;

  constructor(ctx: RequestContext) {
    super(ctx);
    this.repo = new CustomerRepository();
  }

  /**
   * Generates a sequential customer code (e.g. CUST-00001) for the given company.
   */
  private async generateCustomerCode(companyId: string): Promise<string> {
    const sequence = await prisma.sequence.upsert({
      where: { companyId_type: { companyId, type: "CUSTOMER" } },
      update: { lastValue: { increment: 1 } },
      create: { companyId, type: "CUSTOMER", lastValue: 1 },
    });
    
    // Format: CUST-00001
    return `CUST-${sequence.lastValue.toString().padStart(5, "0")}`;
  }

  async createCustomer(input: CreateCustomerInput): Promise<Result<Customer, Error>> {
    return await TransactionManager.run(async (tx) => {
      try {
        const customerCode = await this.generateCustomerCode(this.ctx.companyId);

        const data: Prisma.CustomerUncheckedCreateInput = {
          companyId: this.ctx.companyId,
          customerCode,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          taxId: input.taxId || null,
          creditLimit: input.creditLimit || 0,
          preferredContact: input.preferredContact || null,
          status: "ACTIVE",
        };

        const createdCustomer = await tx.customer.create({
          data
        });

        // If tags were provided, create them
        if (input.tags && input.tags.length > 0) {
          for (const tagName of input.tags) {
            // Upsert Tag
            const tag = await tx.tag.upsert({
              where: { companyId_name: { companyId: this.ctx.companyId, name: tagName } },
              update: {},
              create: { companyId: this.ctx.companyId, name: tagName, color: "#ccc" }
            });
            // Connect to Customer
            await tx.customerTag.create({
              data: {
                customerId: createdCustomer.id,
                tagId: tag.id
              }
            });
          }
        }

        // If notes were provided, add one
        if (input.notes) {
          await tx.customerNote.create({
            data: {
              companyId: this.ctx.companyId,
              customerId: createdCustomer.id,
              authorId: this.ctx.userId,
              text: input.notes
            }
          });
        }

        // Emit Event
        await eventBus.publish({ 
          type: "CustomerCreated", 
          payload: { customerId: createdCustomer.id, companyId: this.ctx.companyId },
          occurredOn: new Date()
        });
        
        // Return full customer
        const fullCustomer = await tx.customer.findUnique({
          where: { id: createdCustomer.id },
          include: { tags: { include: { tag: true } }, notes: true }
        });

        return success(fullCustomer as Customer);
      } catch (error) {
        return failure(error instanceof Error ? error : new Error("Failed to create customer"));
      }
    });
  }

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Result<Customer, Error>> {
    return await TransactionManager.run(async (tx) => {
      try {
        const result = await tx.customer.update({
          where: { id, companyId: this.ctx.companyId },
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            address: input.address,
            taxId: input.taxId,
            creditLimit: input.creditLimit,
            preferredContact: input.preferredContact,
          }
        });

        // Tags update logic omitted for brevity
        
        return success(result);
      } catch (error) {
        return failure(error instanceof Error ? error : new Error("Failed to update customer"));
      }
    });
  }

  async archiveCustomer(id: string): Promise<Result<Customer, Error>> {
    return await TransactionManager.run(async (tx) => {
      try {
        const now = new Date();
        const result = await tx.customer.update({
          where: { id, companyId: this.ctx.companyId },
          data: {
            status: "ARCHIVED",
            deletedAt: now // Soft delete
          }
        });

        // Soft delete all work orders, invoices, and payments associated with this customer
        await tx.workOrder.updateMany({
          where: { customerId: id, companyId: this.ctx.companyId, deletedAt: null },
          data: { deletedAt: now }
        });
        await tx.invoice.updateMany({
          where: { customerId: id, companyId: this.ctx.companyId, deletedAt: null },
          data: { deletedAt: now }
        });
        await tx.payment.updateMany({
          where: { customerId: id, companyId: this.ctx.companyId, deletedAt: null },
          data: { deletedAt: now }
        });

        await eventBus.publish({ 
          type: "CustomerArchived", 
          payload: { customerId: id, companyId: this.ctx.companyId },
          occurredOn: new Date()
        });

        return success(result);
      } catch (error) {
        return failure(error instanceof Error ? error : new Error("Failed to archive customer"));
      }
    });
  }
}
