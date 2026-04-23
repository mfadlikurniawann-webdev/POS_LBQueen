-- SCRIPT KOREKSI DATABASE POS_LBQUEEN
-- 1. Hapus constraint lama
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;

-- 2. Kembalikan data "Stok Bahan Klinik" yang tadinya salah terubah menjadi "Product Care & Beauty"
UPDATE products 
SET type = 'Product Care & Beauty' 
WHERE type = 'Stok Bahan Klinik';

-- 3. Update kembali constraint untuk mengizinkan 4 tipe utama:
-- Treatment Care & Beauty, Product Care & Beauty (tampil di customer)
-- Stok Bahan Klinik, Barang Klinik (tidak tampil di customer)
ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('Treatment Care & Beauty', 'Product Care & Beauty', 'Stok Bahan Klinik', 'Barang Klinik'));
