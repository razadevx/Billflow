import { CompanyRepository } from "../src/domain/administration/repositories/CompanyRepository";

async function main() {
  try {
    const repo = new CompanyRepository();
    console.log("Calling repo.findById with dummy IDs...");
    await repo.findById("dummy-id", "dummy-company-id");
    console.log("Success (unexpected)");
  } catch (error) {
    console.error("FAILED AS EXPECTED:");
    console.error(error);
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
