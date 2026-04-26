const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/"/g, '').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function main() {
  // Update Product Care & Beauty to Stok Bahan Klinik
  const { error: err1 } = await supabase.from('products')
    .update({ type: 'Stok Bahan Klinik' })
    .eq('type', 'Product Care & Beauty');

  if (err1) console.error('Error updating Product Care & Beauty:', err1);
  else console.log('Updated Product Care & Beauty -> Stok Bahan Klinik');

  // Update Barang Kantor to Barang Klinik
  const { error: err2 } = await supabase.from('products')
    .update({ type: 'Barang Klinik' })
    .eq('type', 'Barang Kantor');

  if (err2) console.error('Error updating Barang Kantor:', err2);
  else console.log('Updated Barang Kantor -> Barang Klinik');

  // Any others that need mapping? Let's check Retail products
  const { error: err3 } = await supabase.from('products')
    .update({ type: 'Treatment Care & Beauty' })
    .in('type', [
      'Retail products', 'Retail products nail', 'Retail products eyelash', 'Retail products beauty'
    ]);
  if (err3) console.error('Error updating Retail:', err3);
  else console.log('Updated Retail products -> Treatment Care & Beauty');

  console.log('Migration complete.');
}

main();
