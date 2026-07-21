const fs = require('fs');
const glob = require('glob'); // Not using glob, just hardcoded paths

const files = [
  'src/app/api/v1/workorders/route.ts',
  'src/app/api/v1/workorders/[id]/route.ts',
  'src/app/api/v1/workorders/[id]/actions/route.ts',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/getSystemContext/g, 'getRequestContext');
    content = content.replace(/new WorkOrderService\(\)/g, 'new WorkOrderService(ctx)');
    content = content.replace(/new WorkOrderService\(ctx\)/g, 'new WorkOrderService(ctx)'); // Keep it idempotent
    content = content.replace(/workOrderService\.([a-zA-Z]+)\(ctx,/g, 'workOrderService.$1(');
    fs.writeFileSync(file, content);
  }
});
