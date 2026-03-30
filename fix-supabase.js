const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'app', 'api', 'abacate-pay');

function findFiles(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (file.name === 'route.ts' && file.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('const supabase = createClient(')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const filesToFix = findFiles(targetDir);

console.log(`Found ${filesToFix.length} files to fix:`);
filesToFix.forEach(f => console.log(`  - ${f}`));

filesToFix.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the import and client creation
  content = content.replace(
    /import \{ NextRequest, NextResponse \} from 'next\/server'\nimport \{ createClient \} from '@supabase\/supabase-js'\n\nconst supabase = createClient\(\n  process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/,
    "import { getSupabaseAdmin } from '@/lib/supabase'\nimport { NextRequest, NextResponse } from 'next/server'"
  );
  
  // Replace await supabase with await getSupabaseAdmin()
  content = content.replace(/await supabase/g, 'await getSupabaseAdmin()');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
});

console.log('Done!');
