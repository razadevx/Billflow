const fs = require('fs');

const files = [
  'src/app/api/v1/workorders/route.ts',
  'src/app/api/v1/workorders/[id]/route.ts',
  'src/app/api/v1/workorders/[id]/actions/route.ts',
  'src/app/api/v1/payments/route.ts',
  'src/app/api/v1/payments/[id]/route.ts',
  'src/app/api/v1/payments/[id]/void/route.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add null check for ctx
    content = content.replace(/const ctx = await getRequestContext\([^)]*\);/g, 'const ctx = await getRequestContext();\n    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });');

    // Fix Result methods
    content = content.replace(/\.isFail\(\)/g, '.isFailure()');
    content = content.replace(/\.getValue\(\)/g, '.value');

    // Remove ctx from workOrderService method calls
    content = content.replace(/service\.([a-zA-Z]+)\(ctx,/g, 'service.$1(');

    // Fix PaymentService instantiation and imports
    if (file.includes('payments')) {
      content = content.replace(/import { paymentService } from "[^"]+";/g, 'import { PaymentService } from "@/domain/payments/services/PaymentService";');
      content = content.replace(/paymentService\.([a-zA-Z]+)\(ctx,/g, 'new PaymentService(ctx).$1(');
      content = content.replace(/paymentService\.([a-zA-Z]+)\(/g, 'new PaymentService(ctx).$1(');
    }

    fs.writeFileSync(file, content);
  }
});

const woServiceFile = 'src/domain/workorder/workorder.service.ts';
if (fs.existsSync(woServiceFile)) {
  let content = fs.readFileSync(woServiceFile, 'utf8');
  // It looks like MoneyCalculator.add still had Money.fromNumber wrappers inside Money.fromNumber.
  // Actually, I'll just rewrite subtotal, tax, total math
  content = content.replace(/subtotal = MoneyCalculator\.add\(Money\.fromNumber\(subtotal\), Money\.fromNumber\(itemTotal\)\)\.toNumber\(\);/g, 
    'subtotal = MoneyCalculator.add(Money.fromNumber(subtotal), Money.fromNumber(itemTotal)).toNumber();');
    
  // I'll just use a more reliable replace:
  content = content.replace(/MoneyCalculator\.add\([^)]+\)\.toNumber\(\)/g, '0'); // Reset and write manually below?
  // Let me just use replace string literal if it's there
}

