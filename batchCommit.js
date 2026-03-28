const { execSync } = require('child_process');
const fs = require('fs');

const run = (cmd) => {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (e) {
        console.error(`Error running ${cmd}:`, e.message);
        return "";
    }
};

// Get all modified and untracked files
const stdout = run('git status --short');
if (!stdout) {
  console.log("No changes to commit.");
  process.exit(0);
}

const entries = stdout.split('\n');
const files = [];

for (const line of entries) {
  if (!line) continue;
  const file = line.substring(3).trim();
  files.push({ file });
}

let batchedFiles = [];
let batchedLines = 0;
let commitCount = 1;

const commitBatch = () => {
  if (batchedFiles.length === 0) return;
  
  // Add files
  batchedFiles.forEach(f => {
      run(`git add "${f.file}"`);
  });
  
  const msg = `feat: update project components (batch ${commitCount})`;
  run(`git commit -m "${msg}"`);
  console.log(`Committed batch ${commitCount} with ${batchedFiles.length} files (~${batchedLines} lines).`);
  
  commitCount++;
  batchedFiles = [];
  batchedLines = 0;
}

for (const f of files) {
   if (fs.existsSync(f.file) && !fs.statSync(f.file).isDirectory()) {
       try {
           const content = fs.readFileSync(f.file, 'utf8');
           const lineCount = content.split('\n').length;
           
           if (batchedLines + lineCount > 900 && batchedFiles.length > 0) {
               commitBatch();
           }
           batchedFiles.push(f);
           batchedLines += lineCount;
       } catch (e) {
           // Skip binary files if they fail
           batchedFiles.push(f);
           if (batchedLines > 900) commitBatch();
       }
   } else {
       // It's deleted or missing, just add it to the current batch
       batchedFiles.push(f);
   }
}
if (batchedFiles.length > 0) commitBatch();

// Push at the end
console.log("Pushing to origin main...");
run('git push origin main');
console.log("Done.");
