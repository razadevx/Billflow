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
    content = content.replace(/getSystemContext/g, 'getRequestContext');
    content = content.replace(/new WorkOrderService\(\)/g, 'new WorkOrderService(ctx)');
    content = content.replace(/workOrderService\.([a-zA-Z]+)\(ctx,/g, 'workOrderService.$1(');
    content = content.replace(/new PaymentService\(\)/g, 'new PaymentService(ctx)');
    content = content.replace(/paymentService\.([a-zA-Z]+)\(ctx,/g, 'paymentService.$1(');
    fs.writeFileSync(file, content);
  }
});
