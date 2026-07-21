const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    const regex = /from\s+["'](\.\.\/)+([^"']+)["']/g;
    content = content.replace(regex, (match, p1, p2) => {
      changed = true;
      return `from "@/${p2}"`;
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed imports in', filePath);
    }
  }
});
