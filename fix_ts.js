const fs = require('fs');

// Fix API routes Result and context handling
const apiRoutes = [
  'src/app/api/v1/workorders/route.ts',
  'src/app/api/v1/workorders/[id]/route.ts',
  'src/app/api/v1/workorders/[id]/actions/route.ts',
];

apiRoutes.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix context null check
    content = content.replace(/const ctx = await getRequestContext\(\);/g, 'const ctx = await getRequestContext();\n  if (!ctx) return createErrorResponse("UNAUTHORIZED", "Unauthorized", 401);');
    
    // Fix Result methods
    content = content.replace(/\.isFail\(\)/g, '.isFailure()');
    content = content.replace(/\.error/g, '.error'); // .error exists on Failure
    content = content.replace(/\.getValue\(\)/g, '.value'); // .value exists on Success
    
    fs.writeFileSync(file, content);
  }
});

const paymentRoutes = [
  'src/app/api/v1/payments/route.ts',
  'src/app/api/v1/payments/[id]/route.ts',
  'src/app/api/v1/payments/[id]/void/route.ts'
];
paymentRoutes.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const ctx = await getRequestContext\(\);/g, 'const ctx = await getRequestContext();\n  if (!ctx) return createErrorResponse("UNAUTHORIZED", "Unauthorized", 401);');
    fs.writeFileSync(file, content);
  }
});

// Fix WorkOrderService Money issues
const woServiceFile = 'src/domain/workorder/workorder.service.ts';
if (fs.existsSync(woServiceFile)) {
  let content = fs.readFileSync(woServiceFile, 'utf8');
  content = content.replace(/import { MoneyCalculator } from "@\/server\/core\/money\/MoneyCalculator";/g, 'import { MoneyCalculator } from "@/server/core/money/MoneyCalculator";\nimport { Money } from "@/server/core/money/Money";');
  
  content = content.replace(/subtotal = MoneyCalculator\.add\(subtotal, itemTotal\)\.toNumber\(\);/g, 
    'subtotal = MoneyCalculator.add(Money.fromNumber(subtotal), Money.fromNumber(itemTotal)).toNumber();');
    
  content = content.replace(/tax = MoneyCalculator\.add\(tax, itemTax\)\.toNumber\(\);/g, 
    'tax = MoneyCalculator.add(Money.fromNumber(tax), Money.fromNumber(itemTax)).toNumber();');
    
  content = content.replace(/total = MoneyCalculator\.add\(total, MoneyCalculator\.add\(itemTotal, itemTax\)\.toNumber\(\)\)\.toNumber\(\);/g, 
    'total = MoneyCalculator.add(Money.fromNumber(total), Money.fromNumber(MoneyCalculator.add(Money.fromNumber(itemTotal), Money.fromNumber(itemTax)).toNumber())).toNumber();');
    
  fs.writeFileSync(woServiceFile, content);
}

// Fix Select onValueChange issues
const uiFiles = [
  'src/app/inventory/AdjustStockDialog.tsx',
  'src/app/inventory/InventoryClient.tsx'
];
uiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/onValueChange=\{setCategoryId\}/g, 'onValueChange={(val) => setCategoryId(val as string)}');
    content = content.replace(/onValueChange=\{setReason\}/g, 'onValueChange={(val) => setReason(val as string)}');
    fs.writeFileSync(file, content);
  }
});

// Fix PaymentService missing eventBus import or argument? Wait, PaymentService line 108: `Expected 1-2 arguments, but got 0.`
// Let's check what it is
