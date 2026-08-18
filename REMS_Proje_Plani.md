# REMS (Real Estate Management System) — Detaylı Proje Planı

> Bu plan, **Software Requirements Specification (SRS) v1.8** ve **Stajyer Proje Rehberi**
> dokümanları esas alınarak hazırlanmıştır. Amaç: backend (ASP.NET Core / .NET 8),
> frontend (Angular 15) ve veritabanı (PostgreSQL) katmanlarını, rehberdeki kodlama
> standartlarına uygun şekilde adım adım hayata geçirmek.

---

## 1. Proje Özeti

| Alan | Bilgi |
|---|---|
| Proje Adı | Real Estate Management System (REMS) |
| Amaç | Kullanıcıların kendi taşınmazlarını (arsa/bina/konut) yönetmesi, harita üzerinde görüntülemesi, filtrelemesi, dışa aktarması; adminlerin kullanıcı ve log yönetimi yapması |
| Frontend | Angular 15, Bootstrap, Reactive Forms |
| Backend | ASP.NET Core (.NET 8), katmanlı mimari (Entity/DTO/Service/Interface/Controller) |
| Veritabanı | PostgreSQL + **PostGIS** (poligon/geometri işlemleri için) |
| Kimlik Doğrulama | JWT + SHA-256 (salt'lı) şifreleme |
| Harita | OpenLayers (OSM + Google Maps base layer) |
| Dış Aktarım | Excel (.xlsx) ve PDF (.pdf) |
| Geliştirme Ortamı | Backend → Visual Studio, Frontend → VS Code |

---

## 2. Genel Mimari

```
[Angular 15 (SPA)]  <-- HTTPS / REST/JSON -->  [ASP.NET Core 8 Web API]  <-- EF Core -->  [PostgreSQL + PostGIS]
       |                                              |
   OpenLayers                                   JWT Auth Middleware
   (OSM / Google Maps)                          Logging Middleware (IP + Timestamp)
```

**Backend katman akışı (rehbere göre):**
```
Controller → Interface → Service → Entity (EF Core, DbContext üzerinden _context ile async işlemler)
                                 ↕
                                DTO (Controller ile Service arasında veri taşır)
```

---

## 3. Veritabanı Tasarımı

### 3.1 İlişki Şeması (Özet)

```
Il (1) ───< Ilce (1) ───< Mahalle (1) ───< Taninmazlar (1) ───< TasinmazResimleri
                                                 │
Kullanicilar (1) ───< Taninmazlar                │
Kullanicilar (1) ───< Loglar                     │
Kullanicilar (1) ───< AlanAnalizGeometrileri     │
                                                 └─ Koordinat (PostGIS Polygon)
```
SRS'te belirtilen "Taşınmaz → Mahalle → İlçe → İl" ilişkisi (Stajyer Rehberi, Veritabanı Yapısı) korunmuştur.

### 3.2 Tablolar

#### 3.2.1 `Kullanicilar` (Users)
| Kolon | Tip | Açıklama |
|---|---|---|
| Id | uuid / serial PK | |
| AdSoyad | varchar(150) | |
| Email | varchar(150) UNIQUE, NOT NULL | login için kullanılır |
| SifreHash | varchar(256) NOT NULL | SHA-256 hash |
| SifreSalt | varchar(256) NOT NULL | |
| Rol | varchar(20) NOT NULL | `Admin` / `User` |
| OlusturmaTarihi | timestamp | default now() |
| GuncellemeTarihi | timestamp | nullable |
| AktifMi | boolean | default true |

> REQ (SRS 3.2.9 / 4.2): Şifre 8–12 karakter, en az 1 harf + 1 rakam + 1 özel karakter; DB'de düz metin tutulmaz.

#### 3.2.2 `Il` (City)
| Kolon | Tip |
|---|---|
| Id | int PK |
| Ad | varchar(100) |

#### 3.2.3 `Ilce` (District)
| Kolon | Tip |
|---|---|
| Id | int PK |
| Ad | varchar(100) |
| IlId | int FK → Il.Id |

#### 3.2.4 `Mahalle` (Neighborhood)
| Kolon | Tip |
|---|---|
| Id | int PK |
| Ad | varchar(100) |
| IlceId | int FK → Ilce.Id |

#### 3.2.5 `Taninmazlar` (Properties)
| Kolon | Tip | Açıklama |
|---|---|---|
| Id | uuid/serial PK | |
| KullaniciId | FK → Kullanicilar.Id | sahip |
| MahalleId | FK → Mahalle.Id | il/ilçe buradan türetilir |
| AdaNo | varchar(30) | parcel number |
| ParselNo | varchar(30) | lot number |
| Adres | varchar(300) | |
| TasinmazTipi | varchar(30) | `Arsa` / `Bina` / `Konut` |
| Koordinat | `geometry(Polygon,4326)` (PostGIS) | 4 nokta ile oluşturulan poligon |
| AlanM2 | numeric | opsiyonel, hesaplanmış alan |
| OlusturmaTarihi | timestamp | default now() |
| GuncellemeTarihi | timestamp | nullable |

> REQ (SRS 2.4 / 3.2.2): Koordinat tam olarak 4 nokta ile tanımlanır; il/ilçe/mahalle combobox'tan seçilir.

#### 3.2.6 `TasinmazResimleri` (PropertyImages)
| Kolon | Tip |
|---|---|
| Id | serial PK |
| TasinmazId | FK → Taninmazlar.Id |
| DosyaYolu | varchar(500) — örn. `C:\Uploads\...` |
| DosyaTipi | varchar(10) — JPEG/PNG |
| DosyaBoyutuMB | numeric — max 100MB kontrolü |
| YuklemeTarihi | timestamp |

#### 3.2.7 `Loglar` (Logs)
| Kolon | Tip | Açıklama |
|---|---|---|
| Id | bigserial PK | |
| KullaniciId | FK → Kullanicilar.Id (nullable) | |
| IslemTipi | varchar(50) | `Login`, `AddProperty`, `UpdateProperty`, `DeleteProperty`, `AddUser`, vb. |
| Aciklama | varchar(500) | |
| Durum | varchar(20) | `Basarili` / `Basarisiz` |
| IpAdresi | varchar(45) | IPv4/IPv6 |
| Zaman | timestamp | default now() |

> Not (SRS 4.2 / REQ-11): Loglarda şifre ya da hassas veri tutulmaz.

#### 3.2.8 `AlanAnalizGeometrileri` (AreaAnalysisGeometries)
| Kolon | Tip | Açıklama |
|---|---|---|
| Id | serial PK | |
| KullaniciId | FK → Kullanicilar.Id | |
| Etiket | varchar(5) | `A`, `B`, `C`, `D` (A∪B), `E` (A∪B∪C) |
| Geometri | `geometry(Polygon,4326)` | PostGIS ile union/intersection sonucu |
| AlanM2 | numeric | hesaplanan yüzey alanı |
| OlusturmaTarihi | timestamp | |

> Not: SRS 3.2.10 gereği yalnızca union sonuçları (D, E) veritabanına kaydedilir; intersection sonuçları sadece görselleştirilir (kaydedilmeyebilir ya da geçici tabloya yazılabilir — tasarım kararı olarak `Kaydedildi` boolean kolonu eklenebilir).

### 3.3 İlişkiler (FK Özeti)
- `Ilce.IlId → Il.Id`
- `Mahalle.IlceId → Ilce.Id`
- `Taninmazlar.MahalleId → Mahalle.Id`
- `Taninmazlar.KullaniciId → Kullanicilar.Id` (ON DELETE CASCADE — kullanıcı silinince taşınmazları da silinir, SRS REQ-5)
- `TasinmazResimleri.TasinmazId → Taninmazlar.Id` (ON DELETE CASCADE)
- `Loglar.KullaniciId → Kullanicilar.Id` (ON DELETE SET NULL)
- `AlanAnalizGeometrileri.KullaniciId → Kullanicilar.Id`

### 3.4 Gerekli PostgreSQL Uzantısı
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
Union/intersection ve alan hesabı için `ST_Union`, `ST_Intersection`, `ST_Area` (m² için `geography` cast'i: `ST_Area(geom::geography)`).

---

## 4. Backend Katman Yapısı (Rehbere Uygun)

```
REMS.API/
 ├─ Controllers/
 │   ├─ AuthController.cs
 │   ├─ TasinmazController.cs
 │   ├─ KullaniciController.cs
 │   ├─ LogController.cs
 │   ├─ AlanAnaliziController.cs
 │   └─ ImportExportController.cs
 ├─ Services/
 │   ├─ AuthService.cs
 │   ├─ TasinmazService.cs
 │   ├─ KullaniciService.cs
 │   ├─ LogService.cs
 │   ├─ AlanAnaliziService.cs
 │   └─ ExcelPdfService.cs
 ├─ Interfaces/
 │   ├─ IAuthService.cs
 │   ├─ ITasinmazService.cs
 │   ├─ IKullaniciService.cs
 │   ├─ ILogService.cs
 │   ├─ IAlanAnaliziService.cs
 │   └─ IExcelPdfService.cs
 ├─ Entities/
 │   ├─ Kullanici.cs
 │   ├─ Il.cs / Ilce.cs / Mahalle.cs
 │   ├─ Taninmaz.cs
 │   ├─ TasinmazResmi.cs
 │   ├─ Log.cs
 │   └─ AlanAnalizGeometri.cs
 ├─ DTOs/
 │   ├─ LoginDto.cs / LoginResponseDto.cs
 │   ├─ TasinmazDto.cs / TasinmazFilterDto.cs
 │   ├─ KullaniciDto.cs
 │   ├─ LogDto.cs / LogFilterDto.cs
 │   └─ GeometriDto.cs
 ├─ Data/
 │   └─ RemsDbContext.cs (EF Core, PostGIS NetTopologySuite desteği)
 ├─ Middleware/
 │   ├─ JwtMiddleware.cs
 │   └─ RequestLoggingMiddleware.cs
 └─ Program.cs (Swagger, JWT config, CORS, DI kayıtları)
```

**Kurallar (rehberden):**
- Tüm servis metodları `async/await`, `_context` ile.
- `try-catch` ile hata yönetimi; kritik işlemlerde (kullanıcı silme → taşınmaz silme, union kaydetme) `transaction` kullanımı.
- PascalCase (sınıf/metot), camelCase (değişken).
- Gereksiz yorum/tekrar yok.
- AutoMapper opsiyonel (Entity ↔ DTO dönüşümü için önerilir).

### 4.1 Örnek API Uç Noktaları (Swagger'da test edilecek)

| Modül | Method | Endpoint | Açıklama |
|---|---|---|---|
| Auth | POST | `/api/auth/login` | Login (JWT üretir) |
| Auth | POST | `/api/auth/logout` | Session/refresh token invalidasyonu |
| Taşınmaz | GET | `/api/tasinmazlar` | Filtreleme + sayfalama (query params) |
| Taşınmaz | GET | `/api/tasinmazlar/{id}` | Detay |
| Taşınmaz | POST | `/api/tasinmazlar` | Ekle |
| Taşınmaz | PUT | `/api/tasinmazlar/{id}` | Güncelle |
| Taşınmaz | DELETE | `/api/tasinmazlar/{id}` | Sil |
| Taşınmaz | DELETE | `/api/tasinmazlar/bulk` | Çoklu silme (checkbox) |
| Taşınmaz | POST | `/api/tasinmazlar/{id}/resim` | Görsel yükleme (modal) |
| Taşınmaz | POST | `/api/tasinmazlar/import-excel` | Excel'den içe aktarma |
| Taşınmaz | GET | `/api/tasinmazlar/export/excel` | Excel dışa aktarım |
| Taşınmaz | GET | `/api/tasinmazlar/export/pdf` | PDF dışa aktarım |
| Kullanıcı | GET | `/api/kullanicilar` | Sayfalı liste (Admin) |
| Kullanıcı | POST | `/api/kullanicilar` | Ekle (Admin) |
| Kullanıcı | PUT | `/api/kullanicilar/{id}` | Güncelle (Admin) |
| Kullanıcı | DELETE | `/api/kullanicilar/{id}` | Sil (cascade) (Admin) |
| Log | GET | `/api/loglar` | Filtreleme + sayfalama (Admin) |
| Log | GET | `/api/loglar/export/excel` \| `/pdf` | Dışa aktarım (Admin) |
| Alan Analizi | POST | `/api/alan-analizi/geometri` | A/B/C poligonlarını kaydet (Manuel Çizim) |
| Alan Analizi | GET | `/api/alan-analizi/auto-select` | Kayıtlı A/B/C'yi getir |
| Alan Analizi | POST | `/api/alan-analizi/kesisim` | A∩B veya B∩A |
| Alan Analizi | POST | `/api/alan-analizi/birlesim` | A∪B (D) veya A∪B∪C (E) |
| İl/İlçe/Mahalle | GET | `/api/il`, `/api/ilce/{ilId}`, `/api/mahalle/{ilceId}` | Combobox veri kaynakları |

---

## 5. Frontend Yapısı (Angular 15)

```
src/app/
 ├─ core/
 │   ├─ auth.service.ts (JWT saklama, guard)
 │   ├─ auth.guard.ts (role-based routing)
 │   └─ http-interceptor.ts (Authorization header)
 ├─ models/
 │   ├─ tasinmaz.model.ts
 │   ├─ kullanici.model.ts
 │   ├─ log.model.ts
 │   └─ geometri.model.ts
 ├─ components/
 │   ├─ login/
 │   │   ├─ login.component.ts/html/scss/spec.ts
 │   │   └─ login.service.ts
 │   ├─ tasinmaz-liste/
 │   │   ├─ tasinmaz-liste.component.*
 │   │   └─ tasinmaz-liste.service.ts
 │   ├─ tasinmaz-form/ (ekle/güncelle, Reactive Forms)
 │   ├─ tasinmaz-harita/ (OpenLayers entegrasyonu)
 │   ├─ tasinmaz-import/ (Excel import modal)
 │   ├─ kullanici-yonetimi/
 │   ├─ log-yonetimi/
 │   └─ alan-analizi/ (çizim + kesişim/birleşim işlemleri)
 └─ shared/
     ├─ pagination/
     └─ confirm-dialog/
```

**Kurallar (rehberden):**
- HTML sadece görsel yapı; iş mantığı `.component.ts`, veri erişimi `.service.ts`.
- Servislerde `HttpClient`; API'den gelen veri doğrudan HTML'e değil, önce **modele** aktarılır.
- Reactive Forms zorunlu; tablo görünümleri Bootstrap Table.
- Her component: `.ts`, `.html`, `.scss`, `.spec.ts`.

---

## 6. Yetkilendirme & Güvenlik Planı

- JWT ile kimlik doğrulama; `[Authorize(Roles="Admin")]` / `[Authorize(Roles="User")]` attribute'ları.
- Şifreler SHA-256 + salt ile hashlenip saklanır (**REQ, SRS 4.2**).
- Tüm trafik HTTPS.
- Angular tarafında `AuthGuard` + `RoleGuard` ile sayfa erişim kontrolü (Admin → tüm veriler, User → sadece kendi verisi).
- Her login/CRUD işlemi `Loglar` tablosuna IP + timestamp ile yazılır (middleware üzerinden).
- Rate limiting / unauthorized API denemelerinin engellenmesi (ASP.NET Core middleware).

---

## 7. Sprint / Faz Planı (Örnek 8 Haftalık Takvim)

| Faz | Süre | Kapsam |
|---|---|---|
| **Faz 0 – Kurulum** | 3 gün | PostgreSQL+PostGIS kurulumu, .NET 8 & Angular 15 proje iskeleti, Git repo, Swagger config |
| **Faz 1 – Veritabanı & Auth** | 1 hafta | Tüm tabloların migration'ı, Kullanıcı/İl/İlçe/Mahalle seed verisi, Login (JWT), SHA-256 hashing |
| **Faz 2 – Taşınmaz CRUD** | 1.5 hafta | Add/Update/Delete Property, harita üzerinde 4 nokta seçimi (OpenLayers), Reactive Form validasyonu |
| **Faz 3 – Filtreleme & Görüntüleme** | 1 hafta | Filter Properties, View Properties (harita + liste), pagination, marker click detay |
| **Faz 4 – Dışa/İçe Aktarım** | 1 hafta | Export Excel/PDF (taşınmaz), Import from Excel, medya (resim) yükleme modalı |
| **Faz 5 – Log & Kullanıcı Yönetimi** | 1 hafta | Filter/Export Logs, Add/Update/Delete User (Admin), cascade delete |
| **Faz 6 – Alan Analizi (Union/Intersection)** | 1 hafta | Manuel çizim / Auto-select, PostGIS ile ST_Intersection / ST_Union, m² hesaplama, D/E kaydı |
| **Faz 7 – Test, Güvenlik, Cilalama** | 3-4 gün | Performans (2-3 sn kriterleri), güvenlik kontrolleri, Swagger dokümantasyonu, UI/UX cilası |

---

## 8. Test & Kabul Kriterleri (SRS Bölüm 4'ten özet)

- Login/listeleme işlemleri ≤ 2 sn, filtreleme ≤ 3 sn, CRUD ≤ 5 sn, kesişim hesaplama ≤ 3 sn.
- API isteklerinin %95'i < 1 sn.
- Şifre politikası: 8–12 karakter, harf+rakam+özel karakter.
- Silme işlemlerinde onay diyalogu ("Want to delete?").
- Admin/User yetki ayrımı her modülde test edilmeli (örn. User property ekleyemeyen Admin senaryosu).
- Excel import'ta eksik/kolon uyumsuzluğunda **tüm dosyanın reddedilmesi**.

---

## 9. Riskler & Notlar

- **PostGIS entegrasyonu**: EF Core ile geometri tipleri için `NetTopologySuite` paketi gerekir (`Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`).
- **4 noktalı poligon kısıtı**: Frontend'de OpenLayers çizim aracı tam 4 nokta ile sınırlanmalı; backend'de de doğrulama (defensive validation) yapılmalı.
- **Dosya yükleme yolu**: Windows/macOS uyumlu konfigüre edilebilir dizin (`appsettings.json` içinde `MediaPath`).
- **Union/Intersection kayıt kuralı**: Sadece D ve E (union sonuçları) DB'ye yazılır; kesişim sonuçları sadece görsel — bu ayrım Service katmanında net şekilde ayrılmalı.

---

*Bu doküman, geliştirme sürecinde ilerledikçe (özellikle Faz 6 sonrası PostGIS fonksiyonlarının netleşmesiyle) güncellenmelidir.*
