const fs = require('fs');
const path = require('path');

function processDir(dir, depth) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath, depth + 1);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const sharedPath = '../'.repeat(depth) + 'shared/';
      // This regex matches things like '../../shared/' and replaces with the correct depth
      // but only if it's already an import from shared/
      const regex = /require\(['"](\.\.\/)+shared\//g;
      const newContent = content.replace(regex, `require('${sharedPath}`);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`✅ Fixed imports in ${fullPath}`);
      }
    }
  });
}

// Depth 2 for backend/ (server.js)
// Depth 3 for routes/ and controllers/
const modules = ['modulo-1-registro', 'modulo-2-bolsa', 'modulo-3-seguimiento', 'modulo-4-mentores'];

modules.forEach(mod => {
  const backendDir = path.join(__dirname, mod, 'backend');
  if (fs.existsSync(backendDir)) {
    // server.js is at depth 2 from shared
    const serverFile = path.join(backendDir, 'server.js');
    if (fs.existsSync(serverFile)) {
      let content = fs.readFileSync(serverFile, 'utf8');
      const regex = /require\(['"](\.\.\/)+shared\//g;
      const newContent = content.replace(regex, `require('../../shared/`);
      if (content !== newContent) {
        fs.writeFileSync(serverFile, newContent);
        console.log(`✅ Fixed server.js in ${mod}`);
      }
    }
    
    // routes/ and controllers/ are at depth 3 from shared
    processDir(path.join(backendDir, 'routes'), 3);
    processDir(path.join(backendDir, 'controllers'), 3);
  }
});
