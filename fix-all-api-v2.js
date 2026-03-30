const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Check if file already uses getSupabaseAdmin
  if (content.includes('getSupabaseAdmin')) {
    console.log(`✓ Already uses getSupabaseAdmin: ${filePath}`);
    return false;
  }
  
  // Pattern 1: createClient with NEXT_PUBLIC_SUPABASE_URL
  const pattern1 = /import \{ NextRequest, NextResponse \} from 'next\/server'\nimport \{ createClient \} from '@supabase\/supabase-js'\n\nconst supabase = createClient\(\n  process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/g;
  
  // Pattern 2: createClient with SUPABASE_URL (like bible-study)
  const pattern2 = /import \{ createClient \} from '@supabase\/supabase-js'\nimport \{ NextRequest, NextResponse \} from 'next\/server'\n\nconst supabase = createClient\(\n  process\.env\.SUPABASE_URL!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/g;
  
  // Pattern 3: Different order
  const pattern3 = /import \{ NextRequest, NextResponse \} from 'next\/server'\nimport \{ createClient \} from '@supabase\/supabase-js'\n\nconst supabase = createClient\(\n  process\.env\.SUPABASE_URL!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/g;
  
  // Pattern 4: With service role comment
  const pattern4 = /import \{ NextRequest, NextResponse \} from 'next\/server'\nimport \{ createClient \} from '@supabase\/supabase-js'\n\n\/\/ Usar service role key para operações administrativas\nconst supabase = createClient\(\n  process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/g;
  
  // Pattern 5: Any createClient at module level
  const pattern5 = /const supabase = createClient\(\n  process\.env\.[A-Z_]*!,\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY!\n\)/g;
  
  const newPattern = `import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'`;
  
  if (pattern1.test(content) || pattern2.test(content) || pattern3.test(content) || pattern4.test(content)) {
    content = content.replace(pattern1, newPattern);
    content = content.replace(pattern2, newPattern);
    content = content.replace(pattern3, newPattern);
    content = content.replace(pattern4, newPattern);
    changed = true;
  }
  
  // Replace any remaining module-level createClient
  if (pattern5.test(content)) {
    content = content.replace(pattern5, '');
    // Add the imports at the top if not already there
    if (!content.includes('getSupabaseAdmin')) {
      content = content.replace(
        /import \{ NextRequest, NextResponse \} from 'next\/server'/,
        'import { getSupabaseAdmin } from \'@/lib/supabase\'\nimport { NextRequest, NextResponse } from \'next/server\''
      );
    }
    changed = true;
  }
  
  // Replace await supabase with await getSupabaseAdmin()
  if (content.includes('await supabase')) {
    content = content.replace(/await supabase/g, 'await getSupabaseAdmin()');
    changed = true;
  }
  
  // Remove any module-level supabase declaration
  if (content.includes('const supabaseAdmin = getSupabaseAdmin()')) {
    content = content.replace(/const supabaseAdmin = getSupabaseAdmin\(\)\n/g, '');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fixedCount += findAndFixFiles(fullPath);
    } else if (file.name === 'route.ts' && file.isFile()) {
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Fix all API routes
console.log('🔧 Scanning and fixing ALL API routes...');
const fixedCount = findAndFixFiles(path.join(__dirname, 'app', 'api'));
console.log(`\n🎉 Total files fixed: ${fixedCount}`);

if (fixedCount > 0) {
  console.log('\n📦 Ready to commit and push!');
} else {
  console.log('\n✅ No files needed fixing!');
}
