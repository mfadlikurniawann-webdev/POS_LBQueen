-- SCRIPT PEMBERSIHAN DAN RESTRUKTURISASI DATABASE POS_LBQUEEN

-- 1. Hapus constraint tipe yang lama agar kita bisa memasukkan tipe baru
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;

-- 2. Hapus kolom category_id di tabel products yang sudah tidak terpakai
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

-- 3. Hapus tabel categories karena kita sudah menggunakan sistem 'type' dan 'sub_category' yang langsung ditanam (hardcoded) di frontend
DROP TABLE IF EXISTS categories CASCADE;

-- 4. Update data produk lama agar menyesuaikan dengan 3 tipe utama yang baru

-- Mengubah "Product Care & Beauty" menjadi "Stok Bahan Klinik"
UPDATE products 
SET type = 'Stok Bahan Klinik' 
WHERE type = 'Product Care & Beauty';

-- Mengubah "Barang Kantor" dan "Aset Karyawan" menjadi "Barang Klinik"
UPDATE products 
SET type = 'Barang Klinik' 
WHERE type IN ('Barang Kantor', 'Aset Karyawan');

-- Mengubah "Retail products" dll menjadi "Treatment Care & Beauty"
UPDATE products 
SET type = 'Treatment Care & Beauty' 
WHERE type IN ('Retail products', 'Retail products nail', 'Retail products eyelash', 'Retail products beauty', 'Retail Beauty', 'Retail Eyelash', 'Treatment');

-- (Opsional) Jika ada tipe yang benar-benar tidak dikenal, kita default ke Stok Bahan Klinik atau hapus (di sini di-set ke Stok Bahan Klinik untuk amannya)
UPDATE products 
SET type = 'Stok Bahan Klinik' 
WHERE type NOT IN ('Treatment Care & Beauty', 'Stok Bahan Klinik', 'Barang Klinik');

-- 5. Tambahkan kembali constraint yang ketat hanya untuk 3 kategori ini
ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('Treatment Care & Beauty', 'Stok Bahan Klinik', 'Barang Klinik'));

-- Selesai! Data lama sudah aman, dan database yang tidak dipakai sudah dihapus.
