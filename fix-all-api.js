const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file already uses getSupabaseAdmin
  if (content.includes('getSupabaseAdmin')) {
    console.log(`✓ Already fixed: ${filePath}`);
    return;
  }
  
  // Replace the old pattern
  const oldPattern = /import \{ NextRequest, NextResponse \} from 'next\/server'\nimport \{ createClient \} from '@supabase\/supabase-js'\n\nconst supabase = createClient\(\n  process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/g;
  
  const newPattern = `import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'`;
  
  content = content.replace(oldPattern, newPattern);
  
  // Replace await supabase with await getSupabaseAdmin()
  content = content.replace(/await supabase/g, 'await getSupabaseAdmin()');
  
  // Remove any module-level supabase declaration
  content = content.replace(/const supabase.*=.*getSupabaseAdmin\(\)\n/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findAndFixFiles(fullPath);
    } else if (file.name === 'route.ts' && file.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('const supabase = createClient(')) {
        fixFile(fullPath);
      }
    }
  }
}

// Fix all API routes
console.log('Fixing all API routes...');
findAndFixFiles(path.join(__dirname, 'app', 'api'));
console.log('Done!');
