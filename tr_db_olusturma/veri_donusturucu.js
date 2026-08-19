const fs = require('fs');

// 1. İndirdiğin JSON dosyasının adı (JSON dosyanı bu script ile aynı klasöre koy)
const rawData = fs.readFileSync('turkiye.json', 'utf8');
const data = JSON.parse(rawData);

let sqlContent = '-- TÜRKİYE İL, İLÇE VE MAHALLE VERİLERİ\n';
sqlContent += 'BEGIN;\n\n';

console.log('SQL dönüştürme işlemi başlıyor...');

// 2. İLLER DÖNGÜSÜ
data.forEach(il => {
  const ilId = parseInt(il.il_id);
  const ilAdi = il.il_adi.replace(/'/g, "''"); // SQL Injection / Kesme işareti kaçışı
  sqlContent += `INSERT INTO "Iller" ("Id", "Ad") VALUES (${ilId}, '${ilAdi}') ON CONFLICT ("Id") DO NOTHING;\n`;

  // 3. İLÇELER DÖNGÜSÜ
  if (il.ilceler && Array.isArray(il.ilceler)) {
    il.ilceler.forEach(ilce => {
      const ilceId = parseInt(ilce.ilce_id);
      const ilceAdi = ilce.ilce_adi.replace(/'/g, "''");
      sqlContent += `INSERT INTO "Ilceler" ("Id", "Ad", "IlId") VALUES (${ilceId}, '${ilceAdi}', ${ilId}) ON CONFLICT ("Id") DO NOTHING;\n`;

      // 4. MAHALLELER DÖNGÜSÜ
      if (ilce.mahalleler && Array.isArray(ilce.mahalleler)) {
        ilce.mahalleler.forEach(mahalle => {
          const mahalleAdi = mahalle.mahalle_adi.replace(/'/g, "''");
          sqlContent += `INSERT INTO "Mahalleler" ("Ad", "IlceId") VALUES ('${mahalleAdi}', ${ilceId});\n`;
        });
      }
    });
  }
});

sqlContent += '\nCOMMIT;\n';

// 5. Üretilen devasa SQL dosyasını kaydet
fs.writeFileSync('turkiye_verisi.sql', sqlContent, 'utf8');
console.log(' Harika! "turkiye_verisi.sql" dosyası başarıyla üretildi.');