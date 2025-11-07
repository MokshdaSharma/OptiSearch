const fs = require('fs');
const path = require('path');

const SKIP_DIRS = [
  'env', 'node_modules', '__pycache__', 'site-packages', 'Lib', '.git',
  '.vscode', '.idea', 'dist', 'build', 'coverage'
];

function printDirTree(dirPath, indent = '', depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return;
  const items = fs.readdirSync(dirPath).filter(item => !SKIP_DIRS.includes(item));
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    // Standard ASCII tree symbols: Use "|-- " for not last, "`-- " for last
    const prefix = isLast ? '`-- ' : '|-- ';
    console.log(indent + prefix + item);
    if (fs.statSync(path.join(dirPath, item)).isDirectory()) {
      printDirTree(
        path.join(dirPath, item),
        indent + (isLast ? '    ' : '|   '),
        depth + 1,
        maxDepth
      );
    }
  });
}

printDirTree('.', '', 0, 3); // Change maxDepth as needed
