const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('page.tsx') || file.endsWith('client.tsx')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = walk('c:/Users/jouda/Desktop/AgarthaOS/agartha-os/src/app/management');
let total = 0;
for (const file of files) {
  if (file.includes('layout')) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // We look for the first occurrence of justify-between that precedes a <div className="flex... like gap-3 or gap-4
  // We can just find the first `justify-between` in the file. Since these are pages, it's almost always the top header wrapper.
  const match = content.match(/justify-between/);
  if (match) {
    // Only replace the FIRST occurrence in the file!
    content = content.replace('justify-between', 'justify-end');
    fs.writeFileSync(file, content);
    console.log('Modified:', path.basename(file));
    total++;
  }
}
console.log('Total modified:', total);
