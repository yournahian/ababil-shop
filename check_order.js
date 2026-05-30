const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/storefront/.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', 'eb207f40-9412-41bb-8d16-92cebe6d5251')
    .single();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Order Data:", JSON.stringify(data, null, 2));
  }
}

main();
