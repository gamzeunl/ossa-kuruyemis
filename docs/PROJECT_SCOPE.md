# OSSA Kuruyemiş — Proje Kapsamı ve Gereksinim Analizi

## 1. Vizyon ve Hedefler

OSSA Kuruyemiş, gerçek müşterilerin güvenle alışveriş yapabileceği, production seviyesinde bir e-ticaret platformudur. Öncelik sırası:

1. **Güvenlik** — ödeme, sipariş, stok, kupon işlemlerinde veri bütünlüğü ve dolandırıcılığa karşı dayanıklılık.
2. **Doğruluk** — sipariş/ödeme/stok akışlarında yarış durumu (race condition) ve tutarsızlık riski sıfıra yakın olmalı.
3. **Performans ve teknik SEO** — Core Web Vitals'ta üst seviye skor, arama motorlarında sağlıklı indexlenme.
4. **Sürdürülebilirlik** — okunabilir, test edilebilir, dokümante edilmiş, ölçeklenebilir kod tabanı.

Bu doküman "ne inşa ediyoruz" sorusuna cevap verir; "nasıl inşa ediyoruz" için bkz. [ARCHITECTURE.md](ARCHITECTURE.md), veri modeli için [DATABASE_DESIGN.md](DATABASE_DESIGN.md).

## 2. Kapsam Dışı (şimdilik)

Aşağıdakiler ilk sürüm (MVP → V1) kapsamına dahil edilmemiştir; ileride ayrı fazlarda değerlendirilebilir:
- Çoklu dil / çoklu para birimi desteği
- Pazaryeri entegrasyonları (Trendyol, Hepsiburada vb.)
- Abonelik/tekrarlayan sipariş modeli
- Mobil native uygulama
- Çoklu depo/lokasyon stok yönetimi (V1'de tek depo varsayılır)

Bu kararlar [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) içinde "gelecek faz adayları" olarak da işaretlenmiştir.

## 3. Müşteri Tarafı Özellikleri

| Alan | Kapsam |
|---|---|
| Katalog | Kategori/alt kategori gezintisi, ürün listeleme, filtreleme (fiyat, gramaj, kategori), sıralama (öne çıkan, fiyat, yeni) |
| Ürün detay | Varyant (gramaj) seçimi, çoklu görsel, stok durumu, ilişkili ürünler, yorum/puan gösterimi |
| Arama | `SearchProvider` soyutlaması arkasında; V1: PostgreSQL tabanlı metin araması, ileride Meilisearch/Typesense/Algolia'ya geçilebilir (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §7.3) |
| Sepet | Misafir sepeti (cookie/localStorage tabanlı, sunucu tarafında `Cart` kaydı ile senkron), kupon uygulama, kargo tahmini |
| Checkout | Misafir checkout + üye checkout, adres formu, kargo seçimi, ödeme (iyzico Checkout Form) |
| Üyelik | Kayıt/giriş, adres defteri, sipariş geçmişi, favoriler, profil bilgisi güncelleme |
| Sipariş takip | Üye: hesap üzerinden; misafir: sipariş numarası + e-posta/telefon doğrulamasıyla |
| İade/iptal talebi | Sipariş detayından iade/iptal talebi oluşturma, talep durumu takibi |
| Bildirimler | Sipariş onayı, kargoya verildi, teslim edildi, ödeme başarısız, iade durumu — e-posta (V1); SMS gelecek faz adayı |
| İçerik | Blog (SEO odaklı bilgilendirici içerik), statik sayfalar (hakkımızda, KVKK, mesafeli satış sözleşmesi, iade koşulları, SSS, iletişim) |
| Erişilebilirlik | Klavye navigasyonu, semantik HTML, yeterli kontrast, form hata mesajlarının ekran okuyucularla uyumlu duyurulması (WCAG 2.1 AA hedefi) |

## 4. Admin Panel Özellikleri

| Alan | Kapsam |
|---|---|
| Kimlik doğrulama | Ayrı admin girişi, rol bazlı yetkilendirme (bkz. [DATABASE_DESIGN.md](DATABASE_DESIGN.md) `Role`) |
| Ürün yönetimi | Ürün/varyant/görsel CRUD, kategori ağacı yönetimi, SEO alanları (başlık, açıklama, slug) |
| Stok yönetimi | Stok seviyesi görüntüleme/güncelleme, stok hareketleri geçmişi (`InventoryMovement`), düşük stok uyarısı |
| Sipariş yönetimi | Sipariş listesi/detayı, durum güncelleme, kargo bilgisi girme, iade/iptal onayı |
| Ödeme görünürlüğü | Ödeme durumu ve deneme geçmişi görüntüleme (kart bilgisi **asla** görüntülenmez/saklanmaz) |
| Kupon/kampanya | Kupon oluşturma (yüzde/tutar, min. sepet tutarı, kullanım limiti, geçerlilik tarihi), kampanya banner yönetimi |
| İçerik yönetimi | Blog yazısı CRUD, ana sayfa banner/vitrin yönetimi, site ayarları (`SiteSetting`) |
| Kullanıcı yönetimi | Müşteri listesi, admin/staff kullanıcı yönetimi (yalnızca üst rol) |
| Denetim | Audit log görüntüleme (kim, ne zaman, hangi işlemi yaptı) |
| Raporlama | V1: temel satış/sipariş özet raporları; gelişmiş analytics gelecek faz adayı |

## 5. Sipariş Yaşam Döngüsü

```
PENDING (oluşturuldu, ödeme bekleniyor)
  → PAYMENT_PROCESSING (iyzico Checkout Form'a yönlendirildi)
    → PAID (callback doğrulandı, ödeme onaylandı) → CONFIRMED (stok kesin düşüldü)
      → PROCESSING (hazırlanıyor)
        → SHIPPED (kargoya verildi, takip no atandı)
          → DELIVERED (teslim edildi)
    → PAYMENT_FAILED (ödeme reddedildi/iptal edildi) → CANCELLED (rezerve stok serbest bırakılır)
  → EXPIRED (belirli süre içinde ödeme tamamlanmadı) → CANCELLED
CONFIRMED/PROCESSING/SHIPPED → RETURN_REQUESTED → RETURNED / RETURN_REJECTED
herhangi bir aşamada (sevkiyat öncesi) → CANCELLATION_REQUESTED → CANCELLED
```

Durum geçişleri sunucu tarafında bir durum makinesi (state machine) ile zorlanır; geçersiz geçişler (ör. `SHIPPED` → `PENDING`) reddedilir. Detaylı risk senaryoları için bkz. [SECURITY.md](SECURITY.md) §Risk Analizi.

## 6. Ödeme Yaşam Döngüsü

```
Checkout onayı → sunucu: sepet + fiyatları yeniden hesapla → Order (PENDING) oluştur
  → PaymentAttempt oluştur → iyzico Checkout Form initialize (server-to-server)
  → kullanıcı iyzico formunda ödemeyi tamamlar
  → iyzico callback (Route Handler) → imza doğrulama (X-IYZ-SIGNATURE-V3) → iyzico'dan ödeme durumu sorgulanır (retrieve)
    → başarılı ve doğrulanmış: Payment=SUCCEEDED, Order=PAID (idempotent, tek DB transaction)
    → başarısız: Payment=FAILED, Order=PAYMENT_FAILED
  → kullanıcı tarayıcıda "teşekkürler" sayfasına yönlendirilir — bu yönlendirme ASLA tek başına ödeme onayı sayılmaz, sayfa sipariş durumunu sunucudan tekrar sorgular
```

Bir `Order` için birden fazla `PaymentAttempt` olabilir (kart reddi sonrası yeniden deneme). Callback idempotency ve çifte ödeme önleme detayları [SECURITY.md](SECURITY.md) içinde.

## 7. Stok Yaşam Döngüsü

- Her `ProductVariant` için `Inventory.quantityAvailable` (satılabilir) ve `quantityReserved` (sepette/ödeme bekleyen siparişlerde rezerve) ayrı tutulur.
- Sepete ekleme aşamasında **sert rezervasyon yapılmaz** (yalnızca görüntüleme amaçlı stok kontrolü); checkout başlatıldığında kısa süreli (ör. 10-15 dk) rezervasyon oluşturulur ve süre dolarsa otomatik serbest bırakılır.
- Ödeme onaylandığında (`Order=PAID`) rezervasyon kesin düşüşe çevrilir (`InventoryMovement` kaydı: `type=SALE`).
- İptal/iade durumunda stok geri eklenir (`InventoryMovement.type=RETURN` / `RESTOCK`).
- Tüm stok değişiklikleri `InventoryMovement` tablosunda referans (`orderId`, `reason`, `actorId`) ile izlenebilir — stok asla doğrudan `UPDATE` ile "sessizce" değişmez.

## 8. Kargo Hesaplama Sistemi

- Kargo, `CarrierProvider` soyutlaması arkasında tasarlanır (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §7.2). **V1: manuel kargo yönetimi** — kural tabanlı ücret (sabit ücret + belirli sepet tutarı üzerinde ücretsiz kargo eşiği, `SiteSetting` üzerinden yönetilir, koda gömülmez), takip numarası admin tarafından elle girilir. Herhangi bir kargo firması API'sine bağımlılık yoktur.
- İleride Yurtiçi, Aras, MNG, Sürat veya başka bir firmanın API'si (gerçek zamanlı fiyat/takip) `CarrierProvider` arayüzünün yeni bir implementasyonu olarak eklenebilir; kesin firma/anlaşma seçimi işletme kararına bağlı bir açık sorudur (bkz. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).
- Kargo ücreti her checkout adımında **sunucu tarafında** yeniden hesaplanır; istemciden gelen kargo tutarı hiçbir zaman güvenilmez.

## 9. Kupon ve Kampanya Sistemi

- Kupon türleri (V1): yüzde indirim, sabit tutar indirim, ücretsiz kargo.
- Kısıtlar: minimum sepet tutarı, geçerlilik tarihi aralığı, toplam kullanım limiti, kullanıcı başına kullanım limiti, belirli kategori/ürünle sınırlama (opsiyonel).
- Kupon uygulama sunucu tarafında doğrulanır ve **veritabanı transaction'ı içinde, satır kilidi (`SELECT ... FOR UPDATE` veya benzeri atomik sayaç artırımı) ile** kullanım sayısı kontrol edilir — eşzamanlı kötüye kullanım riskine karşı (bkz. [SECURITY.md](SECURITY.md)).
- Kampanya (`Campaign`): vitrin/banner düzeyinde tematik ürün gruplaması; kupon ile teknik olarak ayrı kavramlardır.
- **Gelecek faz adayı:** sistem, kavramsal olarak otomatik kategori indirimi, çoklu ürün (sepet bazlı) indirimi ve "X al Y öde" gibi kural tabanlı promosyonlara genişleyebilecek şekilde ayrıştırılmıştır, ancak **V1'de bu genişletilmiş kural motoru kurulmaz** — gereksiz karmaşıklığa girmemek için yalnızca yukarıdaki sade kupon/kampanya modeli uygulanır (bkz. [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §8).

## 10. Ürün Varyant Sistemi

- Bir `Product` (ör. "Kavrulmuş Antep Fıstığı") birden çok `ProductVariant` içerir (ör. 250 g, 500 g, 1 kg).
- Her varyantın kendi SKU'su, fiyatı, stok kaydı ve (opsiyonel) kendine özgü görseli olabilir.
- Fiyat, stok ve SKU her zaman **varyant düzeyinde** tutulur; `Product` düzeyinde fiyat/stok alanı yoktur (tekil ürünler dahi tek varyantlı olarak modellenir) — bu, ileride yeni varyant tiplerinin (ör. paket adedi) eklenmesini kolaylaştırır.

## 11. İade ve İptal Süreci

- **İptal:** sipariş `SHIPPED` durumuna geçmeden önce müşteri veya admin tarafından başlatılabilir; ödeme alınmışsa iyzico üzerinden iade (refund) tetiklenir, stok geri eklenir.
- **İade:** teslimattan sonra, mevzuata uygun süre içinde (`SiteSetting` üzerinden yönetilen, varsayılan olarak yasal 14 günden az olmayacak şekilde yapılandırılabilir) müşteri iade talebi oluşturur → admin onay/red → onaylanırsa kargo süreci ve refund → stok durumu ürünün tekrar satılabilirliğine göre admin kararıyla güncellenir.
- Refund işlemleri de `Payment`/ayrı bir refund kaydı ile izlenir; kısmi iade senaryosu V1 kapsamında desteklenir (kalem bazlı iade).

## 12. Bildirim Sistemi

- V1 kanalı: e-posta (transactional e-posta sağlayıcısı — sağlayıcı seçimi [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) içinde açık soru).
- Tetikleyici olaylar: sipariş oluşturuldu, ödeme onaylandı, ödeme başarısız, kargoya verildi, teslim edildi, iade/iptal durumu değişti, şifre sıfırlama, e-posta doğrulama.
- Bildirim gönderimi, sipariş/ödeme durum geçişleriyle aynı transaction içinde **değil**, durum geçişi commit edildikten sonra asenkron/best-effort olarak tetiklenir (bildirim gönderim hatası sipariş işlemini asla geri almaz veya bloklamaz).

## 13. İş Kuralları ve Sabit Varsayımlar

- Tüm parasal hesaplamalar (ürün fiyatı, indirim, kargo, toplam) siparişin oluşturulduğu anda sunucuda, güncel veritabanı verisiyle **yeniden hesaplanır**; istemciden gelen hiçbir tutara güvenilmez (bkz. kural #6 — [CLAUDE.md](../CLAUDE.md)).
- Eksik işletme bilgileri (marka rengi, iyzico mağaza bilgileri, kargo firması, e-posta sağlayıcısı, iş adresi/telefon, KVKK metni, komisyon oranları) **varsayılarak kalıcı kod kararı verilmez**; bunlar `SiteSetting` tablosu, ortam değişkenleri veya açıkça işaretlenmiş placeholder olarak tanımlanır. Tam liste: [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
