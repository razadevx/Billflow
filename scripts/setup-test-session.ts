import { db as prisma } from "../src/server/db";
import crypto from "crypto";

async function main() {
  const company = await prisma.company.create({
    data: {
      name: "Test Company Inc",
      email: "test@company.com",
    }
  });

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Test Admin",
      email: "admin@testcompany.com",
      role: "ADMIN"
    }
  });

  const token = crypto.randomBytes(32).toString('hex');
  
  const session = await prisma.session.create({
    data: {
      id: crypto.randomBytes(16).toString('hex'),
      userId: user.id,
      token: token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`SESSION_TOKEN=${token}`);
  console.log(`COMPANY_ID=${company.id}`);
  console.log(`USER_ID=${user.id}`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
