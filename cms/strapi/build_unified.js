const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname);
const frontendDir = path.resolve(rootDir, '../../frontend');
const strapiPublicDir = path.resolve(rootDir, 'public');

console.log('=== Starting Unified Build Script ===');
console.log(`Strapi root: ${rootDir}`);
console.log(`Frontend root: ${frontendDir}`);

// Helper to run commands cleanly
function runCmd(cmd, cwd) {
  console.log(`\n> Running command: ${cmd} (Cwd: ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// Custom recursive directory copy helper using native fs
function copyFolderRecursiveSync(source, target) {
  let files = [];

  const targetFolder = target;
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      const curTarget = path.join(targetFolder, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

try {
  // 1. Build React Frontend Client
  console.log('\n--- 1. Building Frontend Client ---');
  
  // Clear cached Windows node_modules and lockfile on Render to force clean Linux bindings resolution
  const fLock = path.join(frontendDir, 'package-lock.json');
  const fModules = path.join(frontendDir, 'node_modules');
  if (fs.existsSync(fLock)) {
    console.log('Removing cached package-lock.json...');
    fs.unlinkSync(fLock);
  }
  if (fs.existsSync(fModules)) {
    console.log('Removing cached node_modules...');
    fs.rmSync(fModules, { recursive: true, force: true });
  }

  runCmd('npm install --include=dev --include=optional', frontendDir);
  runCmd('npm run build', frontendDir);

  // 2. Prepare Strapi Public Directory
  console.log('\n--- 2. Copying Frontend Assets to Strapi Public ---');
  const frontendDistDir = path.resolve(frontendDir, 'dist');
  
  if (!fs.existsSync(strapiPublicDir)) {
    fs.mkdirSync(strapiPublicDir, { recursive: true });
  }

  const items = fs.readdirSync(frontendDistDir);
  for (const item of items) {
    const srcPath = path.join(frontendDistDir, item);
    const destPath = path.join(strapiPublicDir, item);
    
    if (item === 'uploads') {
      continue;
    }
    
    if (fs.existsSync(destPath)) {
      if (fs.lstatSync(destPath).isDirectory()) {
        fs.rmSync(destPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(destPath);
      }
    }

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    console.log(`  Copied: ${item}`);
  }

  // 3. Build Strapi Admin Panel CMS
  console.log('\n--- 3. Building Strapi CMS Admin Panel ---');
  runCmd('npm run build', rootDir);

  console.log('\n=== Unified Build Completed Successfully! ===');
} catch (err) {
  console.error('\n=== Unified Build Failed! ===');
  console.error(err.stack || err.message);
  process.exit(1);
}
