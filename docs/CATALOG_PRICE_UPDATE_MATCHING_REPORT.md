# Katalog Fiyat Güncelleme — Eşleştirme Raporu

**Tarih:** 2026-08-14
**Durum:** Bu aşamada **DB'ye hiçbir yazma yapılmadı**. Yalnızca salt-okunur analiz. Bu belge, kullanıcının verdiği 146 satırlık gerçek ürün/fiyat listesi ile mevcut DB'deki 136 ACTIVE ürünün eşleştirme raporudur ve sonraki (yazma yapılacak) aşamanın TEK referans kaynağıdır.

**Yöntem:** Normalizasyon yalnızca trim + çoklu boşluk temizleme + Türkçe locale lowercase ile yapıldı (İ→i, I→ı dahil). Bunun ötesindeki hiçbir eşleşme (RENAME sınıfı) otomatik/fuzzy algoritmayla DEĞİL, kategori + fiyat + ürün ailesi bağlamı elle değerlendirilerek karara bağlandı. Kesin olmayan her durum AMBIGUOUS olarak işaretlendi ve DB'ye dokunulmadı.

## Özet

| | |
|---|---:|
| Yeni referans liste | 146 satır |
| DB başlangıç ACTIVE ürün sayısı | 136 |
| EXACT_MATCH | 102 |
| RENAME (güvenli, gerekçeli) | 27 |
| NEW_PRODUCT (öneri) | 6 |
| AMBIGUOUS (kullanıcı kararı gerekli) | 11 |
| TL/kg satır | 121 |
| TL/adet satır | 25 |
| DB_ONLY_PRODUCTS (kesin) | 1 |
| DB_ONLY adayı (AMBIGUOUS'a bağlı) | 6 |

102 + 27 + 6 + 11 = 146 ✓

---

## 1. EXACT_MATCH + RENAME — Fiyat Uygulama Önizlemesi (129 satır)

Aşağıdaki tüm satırlar **güvenle eşleşti**. Fiyat sütunundaki `eski→yeni` değerleri bu görevde henüz **UYGULANMAMIŞ**, yalnızca sonraki aşama için önerilen hesaplamadır (TL/kg satırlarda `kg_fiyatı × gramaj/1000`, TL/adet satırlarda doğrudan atama).

### baharat (18)
| # | Liste adı | Yeni fiyat | Birim | DB ürünü | Sınıf | Varyant → eski / yeni |
|---|---|---:|---|---|---|---|
| 115 | Karabiber | 830 | kg | Karabiber | ✅ | 100 g: 24.9→**83.0** |
| 116 | İsot Biber | 440 | kg | İsot | 🔄RENAME | 100 g: 26.9→**44.0** |
| 118 | Toz Biber | 420 | kg | Toz biber | ✅ | 100 g: 30.9→**42.0** |
| 119 | Pul Biber | 490 | kg | Pul biber | ✅ | 100 g: 32.9→**49.0** |
| 120 | Kimyon | 600 | kg | Kimyon | ✅ | 100 g: 24.9→**60.0** |
| 121 | Toz Kekik | 700 | kg | Toz kekik | ✅ | 100 g: 26.9→**70.0** |
| 122 | Yayla Sumağı | 750 | kg | Yayla sumağı | ✅ | 100 g: 28.9→**75.0** |
| 123 | Hindistan Cevizi | 490 | kg | Hindistan cevizi | ✅ | 100 g: 30.9→**49.0** |
| 124 | Susam | 210 | kg | Susam | ✅ | 100 g: 32.9→**21.0** |
| 125 | Çörekotu | 375 | kg | Çörekotu | ✅ | 100 g: 24.9→**37.5** |
| 127 | Toz Tarçın | 450 | kg | Toz tarçın | ✅ | 100 g: 28.9→**45.0** |
| 128 | Çemen Tozu | 225 | kg | Çemen tozu | ✅ | 100 g: 30.9→**22.5** |
| 129 | Nane Kurusu | 375 | kg | Nane | 🔄RENAME | 100 g: 32.9→**37.5** |
| 130 | Limon Tuzu | 190 | kg | Limon tuzu | ✅ | 100 g: 24.9→**19.0** |
| 131 | Köri | 375 | kg | Köri | ✅ | 100 g: 26.9→**37.5** |
| 132 | Yedibahar | 450 | kg | Yedibahar | ✅ | 100 g: 28.9→**45.0** |
| 133 | Maraş Tarhanası | 300 | adet | Maraş tarhanası | ✅ | 100 g: 30.9→**300** |
| 134 | Karanfil | 900 | kg | Karanfil | ✅ | 100 g: 28.9→**90.0** |

### cay-kahve (15)
| # | Liste adı | Yeni fiyat | Birim | DB ürünü | Sınıf | Varyant → eski / yeni |
|---|---|---:|---|---|---|---|
| 100 | Atom Çay Çeşidi | 60 | adet | Atom çay çeşitleri | 🔄RENAME | 250 g: 99.9→**60** |
| 101 | Papatya Çayı | 900 | kg | Papatya çayı | ✅ | 250 g: 101.9→**225.0** |
| 102 | Ihlamur | 2200 | kg | Ihlamur | ✅ | 250 g: 103.9→**550.0** |
| 103 | Türk Kahvesi | 800 | kg | Türk kahvesi | ✅ | 250 g: 105.9→**200.0** |
| 104 | Kış Çayı Kutu | 70 | adet | Kış çayı | 🔄RENAME | 250 g: 107.9→**70** |
| 105 | Çubuk Tarçın | 525 | kg | Çubuk tarçın | ✅ | 250 g: 99.9→**131.25** |
| 106 | Zerdeçal | 230 | kg | Zerdeçal | ✅ | 250 g: 101.9→**57.5** |
| 107 | Zencefil | 450 | kg | Zencefil | ✅ | 250 g: 103.9→**112.5** |
| 108 | Osmanlı Dibek | 450 | kg | Osmanlı dibek kahvesi | 🔄RENAME | 250 g: 105.9→**112.5** |
| 109 | Biberiye Çayı | 1800 | kg | Biberiye çayı | ✅ | 250 g: 107.9→**450.0** |
| 110 | Osso Kahve Çeşidi | 80 | adet | OSSA Kahve Çeşnisi | 🔄RENAME | 250 g: 99.9→**80** |
| 111 | Hibiskus Çayı | 400 | kg | Hibiskus çayı | ✅ | 250 g: 101.9→**100.0** |
| 112 | Rezene Çayı | 300 | kg | Rezene | 🔄RENAME | 250 g: 103.9→**75.0** |
| 113 | Yeşil Çay | 525 | kg | Yeşil çay | ✅ | 250 g: 105.9→**131.25** |
| 114 | Nescafe 48'li | 450 | adet | Nescafe 48'li | ✅ | 250 g: 107.9→**450** |

### cerez (31)
| # | Liste adı | Yeni fiyat | Birim | DB ürünü | Sınıf | Varyant → eski / yeni |
|---|---|---:|---|---|---|---|
| 10 | Kabak Çekirdeği | 450 | kg | Kabak çekirdeği | ✅ | 500 g: 224.9→**225.0**; 1 kg: 451.9→**450.0** |
| 11 | Salamura Kabak | 500 | kg | Salamura kabak | ✅ | 500 g: 226.9→**250.0**; 1 kg: 453.9→**500.0** |
| 12 | Dakota Çekirdek | 180 | kg | Dakota çekirdek | ✅ | 500 g: 228.9→**90.0**; 1 kg: 455.9→**180.0** |
| 13 | Fıstık İçi | 300 | kg | Fıstık içi | ✅ | 500 g: 230.9→**150.0**; 1 kg: 457.9→**300.0** |
| 14 | Fırt Fıstık | 200 | kg | Fırt fıstık | ✅ | 500 g: 232.9→**100.0**; 1 kg: 449.9→**200.0** |
| 15 | Pastalık Fıstık | 150 | kg | Pastalık fıstık | ✅ | 500 g: 224.9→**75.0**; 1 kg: 451.9→**150.0** |
| 16 | Soslu Mısır | 150 | kg | Soslu mısır | ✅ | 500 g: 226.9→**75.0**; 1 kg: 453.9→**150.0** |
| 17 | Soslu Fıstık | 250 | kg | Soslu fıstık | ✅ | 500 g: 228.9→**125.0**; 1 kg: 455.9→**250.0** |
| 18 | Şekerli Leblebi | 180 | kg | Şekerli leblebi | ✅ | 500 g: 230.9→**90.0**; 1 kg: 457.9→**180.0** |
| 19 | Beyaz Leblebi | 225 | kg | Beyaz leblebi | ✅ | 500 g: 232.9→**112.5**; 1 kg: 449.9→**225.0** |
| 20 | Çıtır Leblebi | 180 | kg | Çıtır leblebi | ✅ | 500 g: 224.9→**90.0**; 1 kg: 451.9→**180.0** |
| 21 | Tuzsuz Sarı Leblebi | 225 | kg | Tuzsuz sarı leblebi | ✅ | 500 g: 226.9→**112.5**; 1 kg: 453.9→**225.0** |
| 22 | Köy Leblebisi | 190 | kg | Köy leblebisi | ✅ | 500 g: 228.9→**95.0**; 1 kg: 455.9→**190.0** |
| 23 | Sarı Leblebi Tuzlu | 225 | kg | Sarı leblebi | 🔄RENAME | 500 g: 230.9→**112.5**; 1 kg: 457.9→**225.0** |
| 24 | Çiğ Kaju | 750 | kg | Çiğ kaju | ✅ | 500 g: 232.9→**375.0**; 1 kg: 449.9→**750.0** |
| 25 | Çiğ Fırt Fıstık | 150 | kg | Çiğ fırt fıstık | ✅ | 500 g: 224.9→**75.0**; 1 kg: 451.9→**150.0** |
| 26 | Çiğ Kabak | 400 | kg | Çiğ kabak | ✅ | 500 g: 226.9→**200.0**; 1 kg: 453.9→**400.0** |
| 27 | Çiğ Fındık İçi | 1250 | kg | Çiğ fındık içi | ✅ | 500 g: 228.9→**625.0**; 1 kg: 455.9→**1250.0** |
| 28 | Çiğ Badem | 750 | kg | Çiğ badem | ✅ | 500 g: 230.9→**375.0**; 1 kg: 457.9→**750.0** ⚠️ aktif indirim var, bkz. §5 |
| 29 | Patlatmalık Mısır | 50 | kg | Patlatmalık mısır | ✅ | 500 g: 232.9→**25.0**; 1 kg: 449.9→**50.0** |
| 30 | Kuru Üzüm Çekirdeği | 330 | kg | Kuru üzüm | 🔄RENAME | 500 g: 224.9→**165.0**; 1 kg: 451.9→**330.0** |
| 31 | Siyah Üzüm | 440 | kg | Siyah üzüm | ✅ | 500 g: 226.9→**220.0**; 1 kg: 453.9→**440.0** |
| 32 | Ceviz İçi | 750 | kg | Ceviz içi | ✅ | 500 g: 228.9→**375.0**; 1 kg: 455.9→**750.0** |
| 33 | Buğday | 75 | kg | Buğday | ✅ | 500 g: 230.9→**37.5**; 1 kg: 457.9→**75.0** |
| 34 | Yağlı Mısır | 160 | kg | Yağlı mısır | ✅ | 500 g: 232.9→**80.0**; 1 kg: 449.9→**160.0** |
| 35 | Kavurga | 140 | kg | Kavurga | ✅ | 500 g: 224.9→**70.0**; 1 kg: 451.9→**140.0** |
| 36 | Zar Kabuklu Kaju | 900 | kg | Zar kabuklu kaju | ✅ | 500 g: 226.9→**450.0**; 1 kg: 453.9→**900.0** |
| 37 | Kabuklu Ceviz | 350 | kg | Kabuklu ceviz | ✅ | 500 g: 228.9→**175.0**; 1 kg: 455.9→**350.0** |
| 38 | Özbek Üzümü | 550 | kg | Özbek üzümü | ✅ | 500 g: 230.9→**275.0**; 1 kg: 457.9→**550.0** |
| 39 | Kuş Üzümü | 750 | kg | Kuş üzümü | ✅ | 500 g: 232.9→**375.0**; 1 kg: 449.9→**750.0** |
| 40 | Menengiç | 550 | kg | Menengiç | ✅ | 500 g: 224.9→**275.0**; 1 kg: 451.9→**550.0** |

### hurma-kuru-meyve (10)
| # | Liste adı | Yeni fiyat | Birim | DB ürünü | Sınıf | Varyant → eski / yeni |
|---|---|---:|---|---|---|---|
| 79 | Premium Hurma | 540 | kg | Premium hurma | ✅ | 500 g: 174.9→**270.0** |
| 80 | Jumbo Hurma | 675 | kg | Jumbo hurma | ✅ | 500 g: 176.9→**337.5** |
| 81 | Bonbon Hurma | 400 | kg | Bonbon hurma | ✅ | 500 g: 178.9→**200.0** |
| 82 | Yaş Hurma 500 g | 150 | adet | Yaş hurma | 🔄RENAME | 500 g: 180.9→**150** |
| 83 | Lüks Suudi Hurma | 350 | kg | Lüks Suudi hurma | ✅ | 500 g: 182.9→**175.0** |
| 88 | Lüx Hurma | 700 | kg | Lüks hurma | 🔄RENAME (yazım: Lüx→Lüks) | 500 g: 174.9→**350.0** |
| 90 | Paket Hurma | 225 | adet | Paket hurma | ✅ | 500 g: 176.9→**225** |
| 92 | M Hurma | 650 | kg | M hurma | ✅ | 500 g: 178.9→**325.0** |
| 96 | Pestil Tatlısı | 270 | kg | Pestil | 🔄RENAME (önceki görevde de aynı eşleşme) | 500 g: 176.9→**135.0** |
| 98 | Domates Kurusu | 330 | kg | Domates kurusu | ✅ | 500 g: 174.9→**165.0** |

### kurabiye-sekerleme (30)
| # | Liste adı | Yeni fiyat | Birim | DB ürünü | Sınıf | Varyant → eski / yeni |
|---|---|---:|---|---|---|---|
| 41 | Çakıl Taşı | 220 | kg | Çakıl taşı | ✅ | 250 g: 74.9→**55.0** |
| 42 | Bonibon | 220 | kg | Bonibon | ✅ | 250 g: 76.9→**55.0** |
| 64 | Kurabiye | 175 | kg | Kurabiye | ✅ | 250 g: 80.9→**43.75** |
| 65 | Gofret | 130 | kg | Gofret | ✅ | 250 g: 82.9→**32.5** |
| 66 | Haşhaşlı Ballı | 200 | kg | Haşhaşlı ballı kurabiye | 🔄RENAME | 250 g: 74.9→**50.0** |
| 69 | Karışık Draje | 60 | adet | Karışık draje | ✅ | 250 g: 78.9→**60** |
| 72 | Şeker Çikolata | 4 | adet | Şeker çikolata | ✅ | 250 g: 78.9→**4** |
| 73 | Fıstık Ezmesi | 150 | kg | Fıstık ezmesi | ✅ | 250 g: 80.9→**37.5** |
| 74 | Tahin Çekilmiş | 200 | adet | Çekilmiş tahin | 🔄RENAME (kelime sırası) | 250 g: 82.9→**200** |
| 75 | Fındıklı Kadayıf | 230 | adet | Fındıklı kadayıf | ✅ | 250 g: 74.9→**230** |
| 76 | Porsiyon Kadayıf | 170 | adet | Porsiyon kadayıf | ✅ | 250 g: 76.9→**170** |
| 77 | Kadayıf 400 gr | 100 | adet | Kadayıf | 🔄RENAME ⚠️ gramaj etiketi DB'de 250 g, listede "400 gr" — çelişki, aşağıda not var | 250 g: 78.9→**100** |
| 78 | Finger | 90 | adet | Finger | ✅ | 250 g: 80.9→**90** |
| 86 | Kıbrıs Gevreği | 160 | adet | Kıbrıs gevreği | ✅ | 250 g: 82.9→**160** |
| 87 | Bardak Kurabiye | 60 | adet | Bardak kurabiye | ✅ | 250 g: 74.9→**60** |
| 91 | Lüxx Badem Şekeri | 525 | kg | Lüx badem şekeri | 🔄RENAME (yazım: Lüxx/Lüx→Lüks) | 250 g: 76.9→**131.25** |
| 94 | Badem Şekeri | 390 | kg | Badem şekeri | ✅ | 250 g: 78.9→**97.5** |
| 95 | Jelibon | 225 | kg | Jelibon | ✅ | 250 g: 80.9→**56.25** |
| 99 | Fındıklı Draje | 750 | kg | Fındıklı draje | ✅ | 250 g: 82.9→**187.5** |
| 135 | Ülker Toffe | 325 | kg | Ülker Toffe | ✅ | 250 g: 74.9→**81.25** |
| 136 | Kent Şekerleri | 265 | kg | Kent şekerleri | ✅ | 250 g: 76.9→**66.25** |
| 138 | Konak Fındık Çikolata | 840 | kg | Konak Fındık Çikolata | ✅ | 250 g: 80.9→**210.0** |
| 139 | Konak Çikolata | 760 | kg | Konak Çikolata | ✅ | 250 g: 82.9→**190.0** |
| 140 | Fondante Çikolata | 430 | kg | Fondante Çikolata | ✅ | 250 g: 74.9→**107.5** |
| 141 | Rugano | 280 | kg | Rugano | ✅ | 250 g: 76.9→**70.0** |
| 142 | Elvan Iceberg | 480 | kg | Elvan Iceberg | ✅ | 250 g: 78.9→**120.0** |
| 143 | Elit Baton Çikolata | 830 | kg | Elit Baton Çikolata | ✅ | 250 g: 80.9→**207.5** |
| 144 | Elit Royal Fındıklı | 750 | kg | Elit Royal Fındıklı | ✅ | 250 g: 82.9→**187.5** |
| 145 | Kalpli Gülen Yüz | 230 | adet | Kalpli Gülen Yüz Çikolata | 🔄RENAME | 250 g: 74.9→**230** |
| 146 | Yummy Şeker | 200 | adet | Yummy Şeker | ✅ | 250 g: 76.9→**200** |

### lokum (25)
| # | Liste adı | Yeni fiyat | Birim | DB ürünü | Sınıf | Varyant → eski / yeni |
|---|---|---:|---|---|---|---|
| 43 | Hindistan Cevizli Lokum | 130 | kg | Hindistan cevizli lokum | ✅ | 400 g: 139.9→**52.0** |
| 44 | Fındıklı Yaprak Lokum | 300 | kg | Fındıklı yaprak lokum | ✅ | 400 g: 141.9→**120.0** |
| 45 | Sade Lokum | 120 | kg | Sade lokum | ✅ | 400 g: 143.9→**48.0** |
| 46 | Güllü Lokum | 120 | kg | Güllü lokum | ✅ | 400 g: 145.9→**48.0** |
| 47 | Mini Güllü Lokum | 150 | kg | Mini güllü lokum | ✅ | 400 g: 147.9→**60.0** |
| 48 | Meyveli Kuş Lokum | 130 | kg | Meyveli kuş lokum | ✅ | 400 g: 139.9→**52.0** |
| 50 | Fındıklı Lokum | 300 | kg | Fındıklı lokum | ✅ | 400 g: 143.9→**120.0** |
| 51 | Cevizli Bandırma | 195 | kg | Cevizli bandırma lokumu | 🔄RENAME | 400 g: 145.9→**78.0** |
| 52 | Bol Cevizli Bandırma | 250 | kg | Bol cevizli bandırma lokumu | 🔄RENAME | 400 g: 147.9→**100.0** |
| 53 | Saray Lokum | 200 | kg | Saray lokum | ✅ | 400 g: 139.9→**80.0** |
| 55 | Lokumlu Bisküvi | 75 | adet | Lokumlu bisküvi | ✅ | 400 g: 143.9→**75** |
| 56 | Pişmaniye | 110 | adet | Pişmaniye | ✅ | 400 g: 145.9→**110** |
| 57 | Jöle Lokumlar | 250 | kg | Jole lokumlar | 🔄RENAME (yazım: Jole→Jöle, önceki görevde de belirlendi) | 400 g: 147.9→**100.0** |
| 58 | Cevizli Lokum | 200 | adet | Cevizli lokum | ✅ | 400 g: 139.9→**200** |
| 59 | Büyük Lokumlu | 110 | adet | Büyük lokumlu bisküvi | 🔄RENAME | 400 g: 141.9→**110** |
| 60 | Ossa Antep Fıstıklı | 790 | kg | OSSA Antep Fıstıklı Lokum | 🔄RENAME (yazım: Ossa→OSSA) | 400 g: 143.9→**316.0** |
| 61 | Ossa Fındıklı | 430 | kg | OSSA Fındıklı Lokum | 🔄RENAME (yazım: Ossa→OSSA) | 400 g: 145.9→**172.0** |
| 63 | Antep Mini Cezerye | 450 | kg | Antep mini cezerye | ✅ | 400 g: 147.9→**180.0** |
| 68 | Fındıklı Mini Lokum | 300 | kg | Fındıklı mini lokum | ✅ | 400 g: 139.9→**120.0** |
| 70 | Ay Lokumları | 265 | kg | Ay lokumları | ✅ | 400 g: 141.9→**106.0** |
| 71 | Hindistan Cevizli | 415 | kg | Hindistan cevizli bandırma | 🔄RENAME (orta güven — bkz. not) | 400 g: 143.9→**166.0** |
| 84 | Ay Lokum Paketi | 240 | adet | Ay lokum paket | 🔄RENAME | 400 g: 145.9→**240** |
| 85 | Susamlı Lokum | 195 | kg | Susamlı lokum | ✅ | 400 g: 147.9→**78.0** |
| 89 | Fitil Lokum | 360 | kg | Fitilli lokum | 🔄RENAME | 400 g: 141.9→**144.0** |
| 97 | Narlı Cevizli | 330 | kg | Narlı cevizli sucuk | 🔄RENAME | 400 g: 139.9→**132.0** |

---

## 2. NEW_PRODUCT — Önerilen Yeni Ürünler (6)

- **1. Antep Fıstığı** — 1400 TL/kg. DB'de "Antep Fıstığı" adında ürün yok. Mevcut "Fıstık içi" (300 TL/kg, ayrı satırda zaten eşleşti) çok farklı fiyatta — aynı ürün değil. Kategori: cerez / Fıstık Çeşitleri (net).
- **6. Lüx Karışık** — 1100 TL/kg. DB'de karışık/mix çerez ürünü hiç yok. Kategori cerez (net), mega-menu alt grubu YOK (mevcut gruplardan hiçbiri "karışık" temasını karşılamıyor) — grupsuz oluşturulabilir.
- **7. Spesiyal Karışık** — 600 TL/kg. Aynı gerekçe — ayrı fiyat noktası, muhtemelen farklı kalite/karışım oranı.
- **8. Mix Çerez** — 850 TL/kg. Aynı gerekçe — ayrı fiyat noktası.
- **9. Karışık Çerez** — 200 TL/kg. Aynı gerekçe — ayrı fiyat noktası (en düşük — muhtemelen ekonomik karışım).
- **49. Fındıklı Mini Cezerye** — 300 TL/kg. DB'de "Fındıklı mini cezerye" yok, yalnızca "Antep mini cezerye" var (ayrı ürün, zaten eşleşti). Kategori: lokum (net, cezerye ürün ailesi).

**Not:** 6/7/8/9 için mega-menu-content.ts'te uygun bir alt grup yok; grupsuz (yalnızca ana kategori `cerez`) oluşturulabilirler veya kullanıcı yeni bir "Karışık Çerezler" grubu tanımlamak isterse ayrıca eklenir.

## 3. AMBIGUOUS — Kullanıcı Kararı Gerekli (11)

- **2. Badem İçi** (750 TL/kg) — DB'de karşılığı olabilecek TEK aday "Çiğ Badem" (#28) — AYNI fiyat (750). Aynı ürünün iki satırda tekrarı mı, yoksa "kavrulmuş/işlenmiş badem içi" adında GERÇEKTEN ayrı bir ürün mü belirsiz; DB'de böyle ayrı bir ürün yok. **Soru:** aynı ürün mü, yeni bir SKU mu?
- **3. Fındık İçi** (1350 TL/kg) — DB'de en yakın aday "Çiğ Fındık İçi" (#27, 1.250 TL/kg) — FARKLI fiyat, muhtemelen gerçekten ayrı bir ürün (kavrulmuş/işlenmiş fındık içi) ama DB'de böyle bir ürün yok. Kör biçimde "Çiğ fındık içi" ile birleştirilmedi.
- **4. Kaju Fıstığı** (800 TL/kg) — DB'de en yakın aday "Çiğ Kaju" (#24, 750 TL/kg) — FARKLI fiyat, aynı belirsizlik.
- **5. Siirt Fıstığı** (1400 TL/kg) — Antep Fıstığı (#1) ile AYNI fiyat. İki ayrı bölgesel isim mi (ticari olarak gerçekten farklı ürünler olabilir), yoksa aynı ürünün iki kez yazılması mı belirsiz.
- **54. Ballı Susamlı** (225 TL/kg) — DB'de HEM "Ballı susamlı lokum" HEM "Ballı susamlı kurabiye" var, liste satırı hangisi olduğunu belirtmiyor. Liste sırasına göre (komşu satırlar lokum grubu) **önerilen: lokum**, ama kesin değil.
- **62. Kayısı İncir Kurusu** (900 TL/kg) — DB'de "Kayısı kurusu" VE "İncir kurusu" AYRI iki ürün olarak duruyor (farklı meyveler). Tek satırda birleşik isim muhtemelen kaynak listede satır/virgül hatası. 900 TL hangisine ait, ikisine de mi uygulanacak belirsiz — birleştirilmedi.
- **67. Ballı Susamlı** (265 TL/kg) — Aynı belirsizlik, ikinci tekrar (bkz. #54). Liste sırasına göre (bir önceki satır "Haşhaşlı Ballı" → kurabiye) **önerilen: kurabiye**, ama kesin değil. **#54/#67 birlikte kullanıcı onayı gerektirir — ters atanırsa fiyatlar karışır.**
- **93. Paket Hurma 2** (650 TL/adet) — "Paket Hurma" (#90, 225 TL/adet) zaten ayrı eşleşti. Önceki bir görevde de ("Paket hurma 2" adında ikinci bir ürün DB'de yok, eklenmedi") bu tam durum değerlendirilip eşleştirilmemişti; tutarlılık için aynı sonuç korundu. 650 TL, 225 TL'nin ~3 katı — büyük boy/farklı paket olabilir ama teyit gerekli.
- **117. Karanfil Paket** (40 TL/adet) — "Karanfil" (#134, 900 TL/kg) ayrı eşleşti (baharat, 100 g). "Paket" hâli mevcut ürüne YENİ bir adet-bazlı varyant mı eklenmeli, yoksa tamamen ayrı bir ürün mü — yapısal karar gerektiriyor, ürün eşleştirme kapsamının ötesinde.
- **126. Kekik Zahter** (600 TL/kg) — DB'de yalnızca "Kekik" var. Önceki bir görevde ("Kekik (Sahter)" adında ayrı ürün DB'de yok) bu tam durum zaten değerlendirilip eşleştirilmemişti; tutarlılık için aynı sonuç korundu. Zahter, bazı satıcılarda kekikten farklı bir karışım olabilir.
- **137. Konak Madlen** (265 TL/kg) — DB'de "Konak Mandule" var. "Madlen" (bilinen bir hamur işi) ile "Mandule" farklı kelimeler; hangisinin yazım hatası olduğu (DB'deki eski kayıt mı, yeni liste mi) belirlenemedi.

## 4. DB_ONLY_PRODUCTS

**Kesin (yeni listede hiçbir satırla ilişkilendirilemedi):**
- **Fındıklı mini cevizli lokum** (lokum) — mevcut fiyat: 141.9 TL / 400 g. Listede "Fındıklı Mini Lokum" (#68) ayrı bir DB ürününe ("Fındıklı mini lokum") zaten eşleşti; bu ürün için karşılık yok.

**AMBIGUOUS kararına bağlı (madde 3'teki kararlara göre DB_ONLY olabilir veya olmayabilir):**
- Kekik, Kayısı kurusu, İncir kurusu, Ballı susamlı kurabiye, Ballı susamlı lokum, Konak Mandule

## 5. İndirim/Bundle Etki Kontrolü

- Aktif indirimi olan TEK varyant: **Çiğ badem / 1 kg** — mevcut price=457.9, discountPrice=400.0. Yeni fiyat 750.0 olacak; 400.0 < 750.0 olduğundan indirim **GEÇERLİ KALIYOR** (geçersiz hâle gelmiyor, `validateVariantDiscountUpdate` ile ayrıca teyit edilecek).
- `BundleOffer` tablosunda şu an **0 kayıt** var — etkilenen/bozulan bundle yok.

## 6a. Uygulama Sonucu (2026-08-14, kullanıcı onayı sonrası)

Kullanıcıya soruldu, aşağıdaki kararlarla DB'ye uygulandı:

- **Ballı Susamlı** #54 (225 TL/kg) → Ballı susamlı **lokum**, #67 (265 TL/kg) → Ballı susamlı **kurabiye** (önerilen eşleştirme onaylandı).
- **Badem İçi/Fındık İçi/Kaju Fıstığı** → aynı ürün kabul edildi, ilgili "Çiğ" ürünlerle birleştirildi. Fındık İçi (1350) ve Kaju Fıstığı (800) çakışan fiyat verdiği için TAM isim eşleşen satırın fiyatı (Çiğ Fındık İçi=1250, Çiğ Kaju=750) esas alındı — çelişki şeffaf olarak not edildi.
- **Antep Fıstığı** ve **Siirt Fıstığı** → gerçekten ayrı iki ürün kabul edildi, ikisi de cerez/Fıstık Çeşitleri'nde NEW_PRODUCT olarak oluşturuldu (1.400 TL/kg).
- **6 yeni ürün** (Antep Fıstığı, Siirt Fıstığı, Lüks Karışık, Spesiyal Karışık, Mix Çerez, Karışık Çerez, Fındıklı Mini Cezerye) → grupsuz oluşturuldu (mega-menu-content.ts değiştirilmedi).
- **Hâlâ çözülmeyen 5 AMBIGUOUS** (Kekik Zahter, Kayısı İncir Kurusu, Paket Hurma 2, Karanfil Paket, Konak Madlen) → dokunulmadı, ilgili DB ürünleri (Kekik, Kayısı kurusu, İncir kurusu, Konak Mandule) eski fiyatını korudu.

Uygulama detayları için bkz. konuşma geçmişindeki son rapor.

## 6. Ek Not — "Kadayıf 400 gr" Gramaj Çelişkisi

Liste satırı #77 "Kadayıf 400 gr" diyor, ancak DB'deki "Kadayıf" ürününün tek varyantı "250 g" olarak kayıtlı. Bu görev yalnızca fiyat günceller, varyant gramajını/adını DEĞİŞTİRMEZ — fiyat (100 TL) mevcut "250 g" varyantına doğrudan uygulanacak (TL/adet kuralı gereği kg dönüşümü yapılmadan). Gramaj etiketinin "400 g" olarak düzeltilip düzeltilmeyeceği ayrı bir karar — bu raporda flagged, DB'de değiştirilmedi.
