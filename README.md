# 🏠 REMS — Real Estate Management System

> Taşınmazlarınızı (arsa, bina, konut) harita üzerinde yönetin, filtreleyin ve analiz edin.

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Özellikler](#-özellikler)
- [Mimari](#-mimari)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [API Uç Noktaları](#-api-uç-noktaları)
- [Proje Yapısı](#-proje-yapısı)
- [Güvenlik](#-güvenlik)

---

## 🌍 Proje Hakkında

**REMS (Real Estate Management System)**, kullanıcıların kendi taşınmazlarını (arsa / bina / konut) kayıt altına almasını, OpenLayers tabanlı interaktif harita üzerinde görüntülemesini ve coğrafi analizler yapmasını sağlayan bir web uygulamasıdır.

Adminler kullanıcı ve log yönetimi yapabilir; tüm kullanıcılar taşınmazlarını Excel / PDF formatında dışa aktarabilir.

---

## 🛠 Teknoloji Yığını

### Backend
| Teknoloji | Sürüm | Açıklama |
|---|---|---|
| ASP.NET Core | .NET 8 | Web API, katmanlı mimari |
| Entity Framework Core | 8.0.29 | ORM, async/await |
| PostgreSQL + PostGIS | — | İlişkisel DB + coğrafi veri |
| NetTopologySuite | 8.0.11 | Poligon / geometri işlemleri |
| JWT Bearer | 8.0.29 | Kimlik doğrulama |
| AutoMapper | 16.2.0 | Entity ↔ DTO dönüşümü |
| ClosedXML | 0.105.1 | Excel (.xlsx) üretimi |
| PdfSharpCore | 1.3.67 | PDF üretimi |
| Swagger / Swashbuckle | 6.6.2 | API dokümantasyonu |

### Frontend
| Teknoloji | Sürüm | Açıklama |
|---|---|---|
| Angular | 22.x | SPA framework |
| OpenLayers (ol) | 10.x | İnteraktif harita |
| Turf.js | 7.x | Coğrafi hesaplamalar |
| Bootstrap | 5.3 | UI bileşenleri |
| Reactive Forms | — | Form yönetimi |

### Altyapı
| Teknoloji | Açıklama |
|---|---|
| PostgreSQL 15+ | Ana veritabanı |
| PostGIS | ST_Union, ST_Intersection, ST_Area |
| SHA-256 + Salt | Şifre hashleme |

---

## ✨ Özellikler

### 👤 Kullanıcı Rolleri
- **Admin** → Tüm taşınmazları görüntüler; kullanıcı ve log yönetimi yapar
- **User** → Yalnızca kendi taşınmazlarını yönetir

### 🗺️ Harita & Coğrafi İşlemler
- OSM / Google Maps base layer (OpenLayers)
- 4 nokta ile poligon çizimi ve taşınmaz kaydı
- Marker tıklanınca taşınmaz detayı
- **Alan Analizi**: A, B, C poligonlarını çizerek;
  - A∩B, B∩C kesişim (intersection) görselleştirmesi
  - A∪B (D) ve A∪B∪C (E) birleşim (union) hesaplama ve kaydetme
  - m² cinsinden yüzey alanı hesabı

### 🏠 Taşınmaz Yönetimi
- Listeleme, filtreleme, sayfalama
- Ekle / Güncelle / Sil (tek & çoklu)
- Görsel yükleme (JPEG/PNG, max 100 MB)
- İl → İlçe → Mahalle hiyerarşik seçimi

### 📊 Dışa / İçe Aktarım
- Taşınmazları **Excel (.xlsx)** ve **PDF** olarak dışa aktarma
- Excel dosyasından toplu taşınmaz içe aktarma

### 📋 Log & Denetim
- Tüm Login / CRUD işlemleri IP adresi + zaman damgasıyla loglanır
- Admin panelinde log filtreleme, sayfalama ve dışa aktarma

---

## 🏗 Mimari

```
[Angular 22 SPA]  <── REST/JSON (HTTPS) ──>  [ASP.NET Core 8 Web API]  <── EF Core ──>  [PostgreSQL + PostGIS]
       |                                              |
   OpenLayers                              JWT Auth Middleware
   (OSM / Google Maps)                    Request Logging Middleware
```

**Backend katman akışı:**
```
Controller → Interface → Service → Entity (EF Core, DbContext)
                                       ↕
                                      DTO (Controller ile Service arasında)
```

---

## 🗄 Veritabanı Şeması

```
Il (1) ──< Ilce (1) ──< Mahalle (1) ──< Tasinmazlar (1) ──< TasinmazResimleri
                                              │
                         Kullanicilar (1) ──< │ (sahip)
                         Kullanicilar (1) ──< Loglar
                         Kullanicilar (1) ──< AlanAnalizGeometrileri
```

### Temel Tablolar
| Tablo | Açıklama |
|---|---|
| `Kullanicilar` | Kullanıcılar (SHA-256 + salt şifreli) |
| `Il / Ilce / Mahalle` | Coğrafi hiyerarşi |
| `Tasinmazlar` | Taşınmaz kaydı — `geometry(Polygon,4326)` |
| `TasinmazResimleri` | Görsel dosya yolları |
| `Loglar` | İşlem logları (IP + zaman damgası) |
| `AlanAnalizGeometrileri` | Union (D, E) sonuçları |

---

## ⚙️ Kurulum

### Gereksinimler
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 20+](https://nodejs.org/) & npm
- [PostgreSQL 15+](https://www.postgresql.org/) + **PostGIS** uzantısı
- Angular CLI: `npm install -g @angular/cli`

### 1. Veritabanı Hazırlama

```sql
-- PostgreSQL'e bağlanın ve PostGIS uzantısını etkinleştirin:
CREATE DATABASE REMS_DB;
\c REMS_DB
CREATE EXTENSION IF NOT EXISTS postgis;
```

`tr_db_olusturma/` klasöründeki SQL dosyalarını sırayla çalıştırarak Türkiye il/ilçe/mahalle seed verilerini yükleyin.

### 2. Backend Yapılandırması

`REMS.API/REMS.API/appsettings.json` dosyasını kendi ortamınıza göre düzenleyin:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=REMS_DB;Username=<kullanici>;Password=<sifre>;Client Encoding=UTF8;"
  },
  "Jwt": {
    "Issuer": "http://localhost:5000",
    "Audience": "http://localhost:5000",
    "ExpireMinutes": "120"
  }
}
```

> ⚠️ `appsettings.json` dosyasına şifre yazmak yerine **User Secrets** ya da ortam değişkenleri kullanmanız önerilir.

### 3. Migration Çalıştırma

```bash
cd REMS.API/REMS.API
dotnet ef database update
```

### 4. Frontend Bağımlılıkları

```bash
cd rems-frontend
npm install
```

---

## 🚀 Çalıştırma

### Backend

```bash
# Seçenek 1 — hazır bat dosyası (Windows)
run_backend.bat

# Seçenek 2 — manuel
cd REMS.API/REMS.API
dotnet run --launch-profile https
```

| Adres | URL |
|---|---|
| HTTPS | `https://localhost:7195` |
| HTTP | `http://localhost:5107` |
| Swagger UI | `https://localhost:7195/swagger` |

### Frontend

```bash
cd rems-frontend
ng serve
```

Uygulama `http://localhost:4200` adresinde çalışır.

---

## 📡 API Uç Noktaları

### 🔐 Auth
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/giris/login` | Giriş (JWT döner) |
| POST | `/api/giris/logout` | Oturum kapatma |

### 🏠 Taşınmazlar
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/tasinmazlar` | Listele (filtre + sayfalama) |
| GET | `/api/tasinmazlar/{id}` | Detay |
| POST | `/api/tasinmazlar` | Ekle |
| PUT | `/api/tasinmazlar/{id}` | Güncelle |
| DELETE | `/api/tasinmazlar/{id}` | Sil |
| DELETE | `/api/tasinmazlar/bulk` | Çoklu sil |
| POST | `/api/tasinmazlar/{id}/resim` | Görsel yükle |
| POST | `/api/tasinmazlar/import-excel` | Excel içe aktar |
| GET | `/api/tasinmazlar/export/excel` | Excel dışa aktar |
| GET | `/api/tasinmazlar/export/pdf` | PDF dışa aktar |

### 👥 Kullanıcılar *(Admin)*
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/kullanicilar` | Listele |
| POST | `/api/kullanicilar` | Ekle |
| PUT | `/api/kullanicilar/{id}` | Güncelle |
| DELETE | `/api/kullanicilar/{id}` | Sil (cascade) |

### 📋 Loglar *(Admin)*
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/loglar` | Listele (filtre + sayfalama) |
| GET | `/api/loglar/export/excel` | Excel dışa aktar |
| GET | `/api/loglar/export/pdf` | PDF dışa aktar |

### 🗺️ Alan Analizi
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/alan-analizi/geometri` | A/B/C poligon kaydet |
| GET | `/api/alan-analizi/auto-select` | Kayıtlı geometrileri getir |
| POST | `/api/alan-analizi/kesisim` | Kesişim (A∩B) hesapla |
| POST | `/api/alan-analizi/birlesim` | Birleşim (D/E) hesapla & kaydet |

### 📍 Konum
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/il` | İl listesi |
| GET | `/api/ilce/{ilId}` | İlçe listesi |
| GET | `/api/mahalle/{ilceId}` | Mahalle listesi |

---

## 📁 Proje Yapısı

```
REMS/
├── REMS.API/
│   └── REMS.API/
│       ├── Controllers/          # HTTP endpoint tanımları
│       ├── Services/             # İş mantığı
│       ├── Interfaces/           # Servis sözleşmeleri
│       ├── Entities/             # EF Core varlık modelleri
│       ├── DTOs/                 # Veri transfer nesneleri
│       ├── Data/                 # DbContext (RemsDbContext)
│       ├── Middleware/           # JWT + Request Logging
│       ├── Mappings/             # AutoMapper profilleri
│       ├── Migrations/           # EF Core migration'ları
│       └── Program.cs            # DI, JWT, CORS, Swagger
│
├── rems-frontend/
│   └── src/app/
│       ├── components/
│       │   ├── login/
│       │   ├── tasinmaz-liste/
│       │   ├── tasinmaz-form/
│       │   ├── kullanici-liste/
│       │   ├── log-liste/
│       │   └── alan-analizi/
│       ├── core/                 # AuthGuard, HTTP Interceptor
│       ├── models/               # TypeScript arayüzleri
│       ├── services/             # API iletişim katmanı
│       └── shared/               # Pagination, Confirm Dialog
│
├── tr_db_olusturma/              # Türkiye il/ilçe/mahalle SQL seed
├── run_backend.bat               # Backend başlatma scripti
└── REMS_Proje_Plani.md           # Detaylı proje planı
```

---

## 🔒 Güvenlik

| Özellik | Uygulama |
|---|---|
| Kimlik Doğrulama | JWT Bearer Token (120 dk. geçerlilik) |
| Şifre Saklama | SHA-256 + rastgele Salt — düz metin tutulmaz |
| Şifre Politikası | 8–12 karakter, en az 1 harf + 1 rakam + 1 özel karakter |
| Yetkilendirme | Role-based (`Admin` / `User`) |
| Frontend Koruma | `AuthGuard` + `RoleGuard` ile route koruması |
| İstek Loglama | Her işlem → IP + zaman damgası → `Loglar` tablosu |
| HTTPS | Tüm trafik şifreli |

---

## 📈 Performans Hedefleri

| İşlem | Hedef Süre |
|---|---|
| Login / Listeleme | ≤ 2 saniye |
| Filtreleme | ≤ 3 saniye |
| CRUD işlemleri | ≤ 5 saniye |
| Kesişim hesaplama | ≤ 3 saniye |
| API isteklerinin %95'i | < 1 saniye |

---

## 📄 Lisans

Bu proje eğitim ve geliştirme amaçlı hazırlanmıştır.
