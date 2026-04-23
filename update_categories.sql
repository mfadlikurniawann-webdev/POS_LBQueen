-- 1. Hapus constraint yang lama agar kita bisa memasukkan kategori baru
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;

-- 2. Update produk yang sebelumnya "Product Care & Beauty" menjadi "Stok Bahan Klinik"
UPDATE products 
SET type = 'Stok Bahan Klinik' 
WHERE type = 'Product Care & Beauty';

-- 3. Update produk yang sebelumnya "Barang Kantor" atau "Aset Karyawan" menjadi "Barang Klinik"
UPDATE products 
SET type = 'Barang Klinik' 
WHERE type IN ('Barang Kantor', 'Aset Karyawan');

-- 4. Update produk Retail menjadi "Treatment Care & Beauty"
UPDATE products 
SET type = 'Treatment Care & Beauty' 
WHERE type IN ('Retail products', 'Retail products nail', 'Retail products eyelash', 'Retail products beauty', 'Retail Beauty', 'Retail Eyelash');

-- 5. Buat constraint baru yang hanya mengizinkan 3 kategori utama (Opsional, tapi disarankan)
ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('Treatment Care & Beauty', 'Stok Bahan Klinik', 'Barang Klinik'));
