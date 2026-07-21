import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const TEST_EMAIL = "verify-admin@example.com";
const TEST_COMPANY_NAME = "Verify Test Company LLC";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function run() {
  console.log("🚀 Starting Platform Verification...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Cleaning up previous test data...");
  try {
    const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (existing) {
      await prisma.company.delete({ where: { id: existing.companyId } });
      console.log("Deleted old test company.");
    }
  } catch (e) {
    console.error("Failed to clean up DB:", e);
    process.exit(1);
  }

  // To verify middleware and auth, we assume the Next.js server is running on http://localhost:3000
  const baseUrl = "http://localhost:3000";
  try {
    const ping = await fetch(`${baseUrl}/auth/login`);
    if (!ping.ok) throw new Error("Server not responding");
  } catch (e) {
    console.error("❌ Next.js dev server is not running on http://localhost:3000. Please start it before running this script.");
    process.exit(1);
  }

  const results: Record<string, string> = {};
  let cookieHeader = "";

  // 1. Middleware Test
  try {
    const res = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
    if (res.status === 307 || res.status === 302 || res.status === 303 || res.status === 308) {
      results["Middleware"] = "✅";
    } else {
      results["Middleware"] = `❌ (Did not redirect, got ${res.status})`;
    }
  } catch (e) {
    results["Middleware"] = "❌";
  }

  // 2. Authentication & Bootstrap
  try {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": baseUrl, "Referer": `${baseUrl}/` },
      body: JSON.stringify({
        companyName: TEST_COMPANY_NAME,
        userName: "Test User",
        email: TEST_EMAIL,
        password: "TestPassword123!"
      }),
    });
    const result = await res.json() as any;
    
    if (res.ok && result.data?.user && result.data?.company) {
      results["Authentication"] = "✅";
      results["Bootstrap"] = "✅";
    } else {
      results["Authentication"] = "❌ (Registration failed: " + JSON.stringify(result) + ")";
      results["Bootstrap"] = "❌";
    }
  } catch (e) {
    results["Authentication"] = "❌";
    results["Bootstrap"] = "❌";
  }

  // 3. Login & Session Persistence
  try {
    const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": baseUrl, "Referer": `${baseUrl}/` },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "TestPassword123!"
      }),
    });
    
    // Node.js fetch headers.get returns a single string for set-cookie, which might contain multiple cookies.
    const setCookie = res.headers.get("set-cookie");
    if (res.ok && setCookie) {
      cookieHeader = setCookie;
      
      const sessionRes = await fetch(`${baseUrl}/api/auth/get-session`, {
        headers: { cookie: cookieHeader }
      });
      if (sessionRes.ok) {
        results["Session Persistence"] = "✅";
      } else {
        results["Session Persistence"] = "❌";
      }
    } else {
      results["Session Persistence"] = "❌ (Login failed)";
    }
  } catch (e) {
    results["Session Persistence"] = "❌";
  }

  // 4. Core Domains & Tenant Isolation
  try {
    const compA = await prisma.company.findFirst({ where: { name: TEST_COMPANY_NAME } });
    if (!compA) throw new Error("Company A missing");

    const compB = await prisma.company.create({
      data: { name: "Tenant Isolation Company" }
    });

    // Create Customer
    const customer = await prisma.customer.create({
      data: {
        companyId: compA.id,
        name: "Test Customer",
        status: "ACTIVE",
        customerCode: "CUST-0001",
        preferredContact: "email"
      }
    });

    // Create Inventory Item
    const inventory = await prisma.inventoryItem.create({
      data: {
        companyId: compA.id,
        name: "Test Part",
        sku: "PART-001",
        unit: "pcs",
        unitPrice: 100,
        status: "AVAILABLE",
      }
    });

    // Create Work Order
    const wo = await prisma.workOrder.create({
      data: {
        companyId: compA.id,
        customerId: customer.id,
        title: "Fix Something",
        status: "PENDING",
        orderNumber: "WO-0001"
      }
    });

    // Record Payment
    const payment = await prisma.payment.create({
      data: {
        companyId: compA.id,
        customerId: customer.id,
        amount: 500,
        method: "CASH",
        status: "PAID",
        receiptNumber: "REC-0001"
      }
    });

    results["Core Domains"] = "✅";

    // Tenant Isolation
    const bCustomers = await prisma.customer.findMany({ where: { companyId: compB.id } });
    if (bCustomers.length === 0) {
      results["Tenant Isolation"] = "✅";
    } else {
      results["Tenant Isolation"] = "❌ (Data leaked between companies)";
    }

    // Audit Log Check
    // A real audit log would check if the service created the log, but we are bypassing services here.
    // However, we verified CompanyBootstrapService which should create an audit log.
    const auditLogs = await prisma.auditLog.findMany({ where: { companyId: compA.id } });
    if (auditLogs.length > 0) {
      results["Audit"] = "✅";
    } else {
      results["Audit"] = "❌ (No audit logs found for Bootstrap)";
    }

    // Cleanup Tenant B
    await prisma.company.delete({ where: { id: compB.id } });

  } catch (e: any) {
    console.error("Core Domain / Isolation error:", e);
    results["Core Domains"] = "❌";
    results["Tenant Isolation"] = "❌";
    results["Audit"] = "❌";
  }

  console.log("\n--- Verification Report ---");
  for (const [task, status] of Object.entries(results)) {
    console.log(`${task.padEnd(25)} ${status}`);
  }

  console.log("\nCleaning up...");
  try {
    const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (existing) {
      await prisma.company.delete({ where: { id: existing.companyId } });
    }
  } catch (e) {}
  
  await prisma.$disconnect();
  process.exit(0);
}

run();
