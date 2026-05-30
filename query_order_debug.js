const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/storefront/.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*');

  if (error) {
    console.error("Error:", error);
    return;
  }

  const matching = orders.filter(o => o.payment_intent_id === 'sim_intent_a9037ad1');
  console.log("Matching Orders Count:", matching.length);
  if (matching.length > 0) {
    console.log("Order details:", JSON.stringify(matching, null, 2));
  } else {
    console.log("All orders in DB:", JSON.stringify(orders.map(o => ({ id: o.id, payment_intent_id: o.payment_intent_id, payment_status: o.payment_status })), null, 2));
  }
}

main();
