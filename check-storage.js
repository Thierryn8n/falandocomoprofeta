const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlwwgnimfuvoxjecdnza.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkStorage() {
  try {
    console.log('🔍 Checking Supabase Storage...');
    
    // List buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;
    
    console.log('✅ Buckets found:', buckets?.length || 0);
    buckets?.forEach(bucket => {
      console.log(`   - ${bucket.id}: ${bucket.public ? 'public' : 'private'} (${bucket.allowed_mime_types?.join(', ') || 'any'})`);
    });
    
    // Check attachments bucket
    const attachmentsBucket = buckets?.find(b => b.id === 'attachments');
    if (attachmentsBucket) {
      console.log('✅ Attachments bucket found');
      
      // List files in attachments bucket
      const { data: files, error: filesError } = await supabase.storage.from('attachments').list();
      if (filesError) {
        console.error('❌ Error listing files:', filesError);
      } else {
        console.log(`✅ Files in attachments bucket: ${files?.length || 0}`);
        files?.forEach(file => {
          console.log(`   - ${file.name} (${file.size || 0} bytes)`);
        });
      }
    } else {
      console.log('❌ Attachments bucket NOT found');
    }
    
    // Check app_config for prophet avatar
    const { data: config, error: configError } = await supabase
      .from('app_config')
      .select('key, value')
      .eq('key', 'prophet_profile')
      .single();
    
    if (configError) {
      console.error('❌ Error fetching prophet profile config:', configError);
    } else {
      console.log('✅ Prophet profile config found');
      const prophetData = config.value;
      console.log(`   - Name: ${prophetData.prophetName}`);
      console.log(`   - Avatar: ${prophetData.prophetAvatar}`);
      
      // Test if avatar URL is accessible
      if (prophetData.prophetAvatar && !prophetData.prophetAvatar.includes('placeholder')) {
        try {
          const response = await fetch(prophetData.prophetAvatar);
          console.log(`   - Avatar URL status: ${response.status}`);
        } catch (error) {
          console.log(`   - Avatar URL error: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking storage:', error.message);
  }
}

checkStorage();
