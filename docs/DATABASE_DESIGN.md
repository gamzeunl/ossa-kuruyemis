# Veritabanı Modeli Taslağı

> Bu doküman ilk taslaktır; alan adları/tipleri Faz 2'de `schema.prisma` yazılırken kesinleşecektir. Amaç, kavramlar ve ilişkiler üzerinde hizalanmaktır. Tüm birincil anahtarlar `cuid()`/`uuid()` gibi tahmin edilemez tanımlayıcılardır — hiçbir tabloda dışa açık, artan integer ID kullanılmaz (kural #10).

## 1. Kimlik ve Erişim

### User
`id, email (unique), passwordHash (nullable — OAuth-only hesap için), name, phone, roleId (FK Role), emailVerifiedAt, isActive, createdAt, updatedAt`

### Role
`id, key (unique: CUSTOMER | STAFF | ADMIN), label, description`
Ayrı tablo olarak modellenmesinin nedeni: ileride STAFF için ince taneli izinler (ör. yalnızca sipariş yönetimi vs. tam admin) gerektiğinde `Role` tablosunu genişletmek, enum'u tüm koda yaymadan mümkün olur.

### Account
Auth sağlayıcısı (OAuth) bağlantıları için: `id, userId (FK), provider, providerAccountId, accessToken, refreshToken, expiresAt` — yalnızca OAuth kullanılırsa gerekli; nihai auth kütüphanesi kararına göre şekli değişebilir ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).

### Session
`id, userId (FK), sessionToken (unique, opak), expiresAt, createdAt` — auth kütüphanesi database-session stratejisi seçerse kullanılır.

### Address
`id, userId (nullable — misafir siparişte snapshot için kullanılmaz, bu tablo yalnızca üye adres defteri), label, fullName, phone, city (il), district (ilçe), neighborhood, addressLine, postalCode, invoiceType (BIREYSEL | KURUMSAL), companyName (nullable), taxOffice (nullable), taxId/TCKN (**hash'lenmiş veya maskeli saklanır**, düz metin tutulmaz), isDefaultShipping, isDefaultBilling, createdAt, updatedAt`

## 2. Katalog

### Category
`id, name, slug (unique, TR karaktersiz), parentId (self-relation, nullable), description, metaTitle, metaDescription, position, isActive`

### Product
`id, name, slug (unique, TR karaktersiz), shortDescription, description, brand (nullable), originCountry (nullable — menşei ülke), ingredients (nullable — içindekiler metni), nutritionalValues (JSON, nullable — besin değeri tablosu), allergenInformation (nullable), storageConditions (nullable — saklama koşulları), shelfLifeDays (Int, nullable — raf ömrü), isFeatured (Boolean, vitrin/öne çıkan), isBestSeller (Boolean, çok satan işareti — otomatik hesaplanabilir ama V1'de admin tarafından elle işaretlenir), sortOrder (Int, kategori/liste içi manuel sıralama), isActive, metaTitle, metaDescription, createdAt, updatedAt`
Fiyat ve stok **Product düzeyinde tutulmaz** — her zaman `ProductVariant` üzerindendir (tekil ürün dahi tek varyant olarak modellenir). Bu ek alanlar hem ürün detay sayfası içeriğini hem SEO yapılandırılmış verisini (`nutritionalValues` → gelecekte besin değeri gösterimi, `allergenInformation` → gıda güvenliği bilgisi) besler.

### ProductVariant
`id, productId (FK), sku (unique), name (ör. "500 g"), weightGram, price (Decimal), compareAtPrice (Decimal, nullable), barcode (nullable), position, isActive`

### ProductImage
`id, productId (FK), variantId (FK, nullable — varyant-özel görsel), url (StorageProvider'ın döndürdüğü tam/CDN URL'i — bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §7.1), altText, position, isPrimary`

### ProductCategory
`productId (FK), categoryId (FK)` — çoktan-çoğa ilişki tablosu, `@@id([productId, categoryId])`

## 3. Stok

### Inventory
`id, variantId (FK, unique — 1:1), quantityAvailable, quantityReserved, lowStockThreshold, updatedAt`
Satılabilir miktar = `quantityAvailable - quantityReserved`. Doğrudan `quantityAvailable` üzerinde serbest `UPDATE` yapılmaz; her değişiklik `InventoryMovement` yaratılarak yapılır (aşağıda).

### InventoryMovement
`id, variantId (FK), type (PURCHASE_IN | RESERVATION | RESERVATION_RELEASE | SALE | RETURN | ADJUSTMENT | DAMAGE), quantityDelta (işaretli int), orderId (FK, nullable), reason, actorId (FK User, nullable — sistem hareketi için null), createdAt`
Bu tablo append-only bir defter (ledger) gibi çalışır; `Inventory.quantityAvailable` bu hareketlerin toplamıyla tutarlı olacak şekilde aynı transaction içinde güncellenir.

## 4. Sepet

### Cart
`id, userId (FK, nullable), guestToken (opak, nullable — misafir sepeti için cookie'de taşınır), status (ACTIVE | CONVERTED | ABANDONED), createdAt, updatedAt`

### CartItem
`id, cartId (FK), variantId (FK), quantity, addedAt`
Sepette fiyat **saklanmaz/saklanır ama güvenilmez** — yalnızca UI'da anlık gösterim için `priceSnapshotAtAdd` tutulabilir; checkout anında her zaman güncel `ProductVariant.price` sunucuda yeniden okunur.

## 5. Sipariş

### Order
`id, orderNumber (unique, opak — bkz. §7), userId (FK, nullable — misafir sipariş), email, phone, status (enum, bkz. PROJECT_SCOPE §5), subtotal, discountTotal, shippingTotal, taxTotal, grandTotal, currency, shippingAddressSnapshot (JSON), billingAddressSnapshot (JSON), invoiceType, couponId (FK, nullable), couponCodeSnapshot (nullable), customerNote (nullable), createdAt, updatedAt, confirmedAt (nullable), cancelledAt (nullable)`
Adresler **snapshot** (JSON) olarak saklanır — müşteri daha sonra adres defterini değiştirse dahi geçmiş sipariş, sipariş anındaki adresi korur.

### OrderItem
`id, orderId (FK), variantId (FK), productNameSnapshot, variantNameSnapshot, skuSnapshot, unitPrice, quantity, lineTotal`
Ürün adı/fiyatı da snapshot alınır — ürün sonradan yeniden adlandırılsa/fiyatı değişse dahi geçmiş sipariş etkilenmez.

## 6. Ödeme

### Payment
`id, orderId (FK), provider (IYZICO), status (PENDING | SUCCEEDED | FAILED | REFUNDED | PARTIALLY_REFUNDED), amount, currency, iyziPaymentId (nullable), iyziConversationId (unique, idempotency anahtarı), createdAt, updatedAt`

### PaymentAttempt
`id, orderId (FK), attemptNumber, status (INITIATED | CALLBACK_RECEIVED | VERIFIED | FAILED), iyzicoToken, iyzicoConversationId (unique), requestedAmount, failureReason (nullable), rawCallbackRef (nullable — ham callback payload'ının güvenli/ayrı bir loga referansı, **kart verisi asla içermez**), createdAt, updatedAt`
Bir `Order` için birden fazla `PaymentAttempt` olabilir (kart reddi → yeniden deneme). `iyzicoConversationId` üzerindeki `unique` kısıt, aynı callback'in iki kez işlenmesini (idempotency) DB seviyesinde garanti eder.

**Kritik kural:** Bu şema hiçbir alanda kart numarası, CVV veya son kullanma tarihi tutmaz. Ödeme, iyzico'nun barındırdığı Checkout Form üzerinden gerçekleşir; uygulama yalnızca iyzico'nun döndürdüğü referans/durum bilgisini saklar (kural #7).

### Shipment
`id, orderId (FK), carrier (V1'de serbest metin/manuel seçim — ileride [ARCHITECTURE.md](ARCHITECTURE.md) §7.2 `CarrierProvider` implementasyonlarına referans olabilir), trackingNumber (nullable), status (PREPARING | SHIPPED | IN_TRANSIT | DELIVERED | RETURNED), shippedAt (nullable), deliveredAt (nullable)`

## 7. Sipariş Numarası — Opak Kimlik Stratejisi

- `Order.id` iç anahtar (cuid) — dışarı **hiçbir zaman** gösterilmez.
- `Order.orderNumber` ayrı, insan-okunur ama **tahmin edilemez** bir alan: örn. `OSSA-YYYYMMDD-<6 haneli rastgele alfanumerik>` — sıralı sayaç değil, kriptografik olarak yeterli rastgelelik içeren bir üretici (ör. `nanoid`/ULID'nin rastgele bileşeni) ile üretilir ve `unique` kısıtla garanti altına alınır. Amaç: bir rakibin ardışık sipariş numaralarını izleyerek günlük sipariş hacmini tahmin edememesi ve bir kullanıcının başka bir siparişi numarayı artırıp/azaltıp tahmin edememesi (kural #10).
- Aynı strateji `PaymentAttempt.iyzicoConversationId` gibi dışarı/üçüncü tarafa giden referanslar için de geçerlidir.

## 8. Kupon ve Kampanya

### Coupon
`id, code (unique), type (PERCENTAGE | FIXED | FREE_SHIPPING), value, minSubtotal (nullable), maxDiscountCap (nullable — yüzde indirimde üst sınır), usageLimitTotal (nullable), usageLimitPerUser (nullable), startsAt, endsAt, isActive, createdAt`

### CouponUsage
`id, couponId (FK), orderId (FK, unique — bir sipariş aynı kuponu iki kez sayamaz), userId (FK, nullable), usedAt`
`(couponId, orderId)` üzerinde `unique` kısıt + kullanım sayımı transaction içinde atomik artırım (bkz. [SECURITY.md](SECURITY.md) §Kuponun Eş Zamanlı Kötüye Kullanımı).

### Campaign
`id, title, slug (unique), description, bannerImageUrl, startsAt, endsAt, isActive, position` — vitrin/banner düzeyinde tematik gruplama; kupondan bağımsız bir kavramdır (indirim mantığı içermeyebilir, salt görsel/pazarlama amaçlı olabilir).

**Genişletilebilirlik notu (V1'de uygulanmayacak):** `Coupon`/`Campaign` modeli, ileride otomatik kategori indirimi, çoklu ürün (sepet bazlı) indirimi ve "X al Y öde" gibi kural tabanlı promosyonlara genişleyebilecek şekilde kavramsal olarak ayrıştırılmıştır (kupon = kullanıcı tarafından girilen kod; kampanya = otomatik/görsel promosyon). V1'de bu genişletilmiş kural motoru **kurulmaz** — yalnızca yukarıdaki sade `Coupon`/`CouponUsage`/`Campaign` alanları uygulanır; gereksiz karmaşıklık (generic "rule engine" tablosu vb.) şimdiden eklenmez.

## 9. İçerik ve Diğer

### Review
`id, productId (FK), userId (FK, nullable), orderItemId (FK, nullable — doğrulanmış satın alma işareti için), rating (1-5), title, body, status (PENDING | APPROVED | REJECTED), createdAt`

### BlogPost
`id, title, slug (unique), excerpt, content, coverImageUrl, status (DRAFT | PUBLISHED), authorId (FK User), publishedAt (nullable), metaTitle, metaDescription, createdAt, updatedAt`

### Banner
`id, title, imageUrl, linkUrl (nullable), placement (HOME_HERO | HOME_SECONDARY | CATEGORY_TOP | ...), startsAt (nullable), endsAt (nullable), isActive, sortOrder`

### SiteSetting
`id, key (unique), value (JSON/string), description, updatedAt, updatedByUserId (FK, nullable)`
Kod içine gömülmeyecek işletme değerleri (ücretsiz kargo eşiği, iletişim bilgisi, sosyal medya linkleri, yasal metin referansları) burada tutulur (kural #19).

### AuditLog
`id, actorId (FK User, nullable — sistem/otomatik işlem için null), actorRole (snapshot, kullanıcı sonradan rol değiştirse de o anki rol kaydı kalır), action (ör. "ORDER_STATUS_CHANGE", "COUPON_CREATE", "PRODUCT_PRICE_UPDATE"), entityType, entityId, beforeSnapshot (JSON, nullable), afterSnapshot (JSON, nullable), ipAddress, userAgent, createdAt`
Append-only; hiçbir kayıt güncellenmez/silinmez. Tüm admin mutasyonları ve ödeme/sipariş durum geçişleri burada iz bırakır (kural #11).

## 10. Transaction Stratejisi (kritik akışlar)

| Akış | Atomiklik yaklaşımı |
|---|---|
| Checkout başlatma (sipariş oluşturma + stok rezervasyonu) | Tek `$transaction`: `Order`+`OrderItem` insert, ilgili `Inventory.quantityReserved` artırımı, `InventoryMovement(type=RESERVATION)` insert. Rezervasyon TTL'i dolarsa arka plan işi (cron/queue) ile serbest bırakılır. |
| Ödeme callback işleme | Tek `$transaction`: `iyzicoConversationId` üzerinden `PaymentAttempt` bul (yoksa/varsa idempotent davran) → `Payment.status` güncelle → `Order.status=PAID` → rezervasyonu kesin `SALE` hareketine çevir. İşlem `iyzicoConversationId` unique kısıtı sayesinde iki kez çalışsa da yan etkisi tekrarlanmaz. |
| Kupon uygulama | Tek `$transaction`, `Serializable` izolasyon veya satır kilidi ile: kullanım sayısını oku → limit kontrolü → `CouponUsage` insert (unique kısıt çifte kullanımı engeller) → aynı transaction'da `Order.discountTotal` güncellenir. |
| İptal/iade | Tek `$transaction`: `Order.status` güncelle, `InventoryMovement(type=RETURN)` insert, `Inventory.quantityAvailable` artır, refund kaydı (`Payment.status=REFUNDED/PARTIALLY_REFUNDED`). |

Genel ilke: **para veya stok miktarını değiştiren her işlem tek bir veritabanı transaction'ı içinde başlar ve biter; ara durumda "yarım kalmış" bir sipariş/stok durumu asla commit edilmez.**

## 11. İlişki Özeti (metinsel)

`User 1—n Order`, `User 1—n Address`, `User 1—1 Role (FK)`, `Product 1—n ProductVariant`, `Product n—n Category (ProductCategory üzerinden)`, `ProductVariant 1—1 Inventory`, `ProductVariant 1—n InventoryMovement`, `Order 1—n OrderItem`, `Order 1—n PaymentAttempt`, `Order 1—1 Payment (aktif)`, `Order 1—n Shipment (nadiren >1, kısmi sevkiyat senaryosunda)`, `Coupon 1—n CouponUsage`, `Order 0—1 CouponUsage`.

Faz 2'de bu taslak `schema.prisma`'ya çevrilirken alan tipleri (Decimal hassasiyeti, enum'lar), index'ler (`orderNumber`, `sku`, `slug`, `email` üzerinde) ve cascade/delete davranışları netleştirilecektir.
