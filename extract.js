const fs = require('fs');
const path = require('path');

const mdPath = process.argv[2];
const destPath = process.argv[3];

const content = fs.readFileSync(mdPath, 'utf8');
const regex = /## `([^`]+)`\n```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/g;

let match;
while ((match = regex.exec(content)) !== null) {
  const fileRelPath = match[1];
  const fileContent = match[2];
  const fullPath = path.join(destPath, fileRelPath);
  
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, fileContent.trim() + "\n");
  console.log(`Created ${fullPath}`);
}
