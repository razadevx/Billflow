const fs = require('fs');

const uiFiles = [
  'src/app/inventory/AdjustStockDialog.tsx',
  'src/app/inventory/InventoryClient.tsx'
];

uiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/onValueChange=\{\(val\) => setCategoryId\(val as string\)\}/g, 'onValueChange={(val) => setCategoryId(val || "")}');
    content = content.replace(/onValueChange=\{\(val\) => setReason\(val as string\)\}/g, 'onValueChange={(val) => setReason(val || "")}');
    fs.writeFileSync(file, content);
  }
});
