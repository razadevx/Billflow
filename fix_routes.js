const fs = require('fs');

// Fix src/app/api/customers/route.ts
let customersRoute = fs.readFileSync('src/app/api/customers/route.ts', 'utf8');
customersRoute = customersRoute.replace('await repo.findAll(context)', 'await repo.findMany(context.companyId)');
customersRoute = customersRoute.replace('const service = new CustomerService();', 'const service = new CustomerService(context);');
customersRoute = customersRoute.replace('await service.createCustomer(parsed.data, context)', 'await service.createCustomer(parsed.data)');
fs.writeFileSync('src/app/api/customers/route.ts', customersRoute);

// Fix src/app/api/customers/[id]/route.ts
let customerIdRoute = fs.readFileSync('src/app/api/customers/[id]/route.ts', 'utf8');
customerIdRoute = customerIdRoute.replace(/const service = new CustomerService\(\);/g, 'const service = new CustomerService(context);');
customerIdRoute = customerIdRoute.replace('await service.update(params.id, parsed.data, context)', 'await service.updateCustomer(params.id, parsed.data)');
customerIdRoute = customerIdRoute.replace('await service.archiveCustomer(params.id, context)', 'await service.archiveCustomer(params.id)');
fs.writeFileSync('src/app/api/customers/[id]/route.ts', customerIdRoute);
