import { contactInfo } from "@/lib/contact-content";
import type { LegalPageContent } from "@/lib/legal-content";

/**
 * Bu sayfa nihai bir "Aydınlatma Metni" değildir — veri sorumlusunun resmî
 * ticari unvanı/vergi bilgisi/MERSİS/KEP adresi (`docs/OPEN_QUESTIONS.md` #6)
 * netleşmeden ve hukuki danışmanlıkla gözden geçirilmeden yayına alınmamalıdır.
 * Bu yüzden yalnızca "OSSA Kuruyemiş" adı kullanılır; kesin olmayan hiçbir
 * hukuki/ticari bilgi uydurulmaz — kapanış notu bunu açıkça belirtir.
 */
export const kvkkContent: LegalPageContent = {
  path: "/kvkk",
  title: "KVKK Aydınlatma Metni",
  seoTitle: "KVKK Aydınlatma Metni | OSSA Kuruyemiş",
  description:
    "OSSA Kuruyemiş olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin hangi amaçlarla işlendiği, kimlerle paylaşılabileceği ve haklarınız hakkında bilgi vermek amacıyla hazırlanmıştır.",
  metaDescription:
    "OSSA Kuruyemiş kişisel verilerin korunması ve işlenmesine ilişkin KVKK Aydınlatma Metni.",
  sections: [
    {
      heading: "1. Veri Sorumlusu",
      paragraphs: [
        "6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') uyarınca veri sorumlusu OSSA Kuruyemiş'tir. Veri sorumlusunun resmî ticari unvanı, vergi dairesi/numarası ve MERSİS bilgileri netleştiğinde bu bölüm güncellenecektir.",
      ],
    },
    {
      heading: "2. İşlenen Kişisel Veriler",
      paragraphs: ["Web sitemiz ve hesap altyapımız üzerinden aşağıdaki veri kategorileri işlenebilir:"],
      list: [
        "Kimlik ve iletişim bilgileri: ad, soyad, e-posta, telefon numarası.",
        "Hesap bilgileri: giriş/şifre bilgisi, oturum kaydı, güvenlik amaçlı IP adresi ve tarayıcı bilgisi.",
        "Adres bilgileri: hesabınıza kaydettiğiniz veya sipariş sırasında girdiğiniz teslimat ve fatura adresi bilgileri.",
        "Sipariş bilgileri: sipariş içeriği, tutarı, durumu ve teslimat süreciyle ilgili bilgiler.",
        "Fatura bilgileri: kurumsal fatura talep edilmesi halinde şirket unvanı, vergi dairesi ve vergi numarası.",
        "Müşteri işlem bilgileri: favori ürünler, ürün değerlendirme/yorum içerikleri.",
        "Talep ve şikâyet bilgileri: iletişim formundan iletilen ad, iletişim bilgisi, talep türü ve mesaj içeriği.",
      ],
    },
    {
      heading: "3. Kişisel Verilerin İşlenme Amaçları",
      paragraphs: [
        "Kişisel verileriniz; üyelik ve hesap işlemlerinin yürütülmesi, sipariş ve teslimat süreçlerinin gerçekleştirilmesi, fatura/muhasebe süreçlerinin yürütülmesi, iletişim taleplerinizin yanıtlanması, ürün değerlendirmelerinin yayınlanması ve site/hesap güvenliğinin sağlanması amaçlarıyla işlenir.",
      ],
    },
    {
      heading: "4. Kişisel Verilerin Aktarılması",
      paragraphs: [
        "Kişisel verileriniz; siparişinizin size ulaştırılabilmesi için kargo/lojistik hizmeti sağlayan iş ortaklarımızla, web sitemizin ve verilerin güvenli barındırılması için altyapı/hosting hizmet sağlayıcılarımızla ve yasal bir zorunluluk bulunması halinde yetkili kamu kurum ve kuruluşlarıyla, KVKK'da öngörülen sınırlar çerçevesinde paylaşılabilir. Kişisel verileriniz bunların dışında üçüncü taraflarla paylaşılmaz.",
      ],
    },
    {
      heading: "5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi",
      paragraphs: [
        "Kişisel verileriniz; hesap oluşturma, sipariş verme, iletişim formu doldurma gibi web sitemiz üzerinden gerçekleştirdiğiniz işlemler sırasında elektronik ortamda toplanır.",
        "Verileriniz; bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, kanunlarda açıkça öngörülmesi, veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi ve ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati gibi KVKK'nın 5. maddesinde sayılan hukuki sebeplere dayanılarak işlenir.",
      ],
    },
    {
      heading: "6. Saklama Süresi",
      paragraphs: [
        "Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amacının gerektirdiği süre boyunca saklanır. Hesap bilgileriniz hesabınız aktif olduğu sürece, sipariş ve fatura kayıtlarınız ise ticari ve vergisel mevzuatın öngördüğü yasal saklama süreleri boyunca muhafaza edilir. Sürelerin sonunda verileriniz silinir, yok edilir veya anonim hâle getirilir.",
      ],
    },
    {
      heading: "7. İlgili Kişinin Hakları",
      paragraphs: ["KVKK'nın 11. maddesi uyarınca bize başvurarak şu haklara sahipsiniz:"],
      list: [
        "Kişisel verinizin işlenip işlenmediğini öğrenme,",
        "İşlenmişse buna ilişkin bilgi talep etme,",
        "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
        "Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,",
        "Eksik/yanlış işlenmişse düzeltilmesini isteme,",
        "KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme,",
        "Düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
        "İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,",
        "Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
      ],
    },
    {
      heading: "8. Başvuru ve İletişim",
      paragraphs: [
        "Yukarıdaki haklarınızı kullanmak için aşağıdaki iletişim bilgilerimiz üzerinden bize ulaşabilirsiniz. Başvurunuz, talebinizin niteliğine göre en kısa sürede ve en geç yasal süreler içinde sonuçlandırılır.",
        "OSSA Kuruyemiş",
        contactInfo.address?.value ?? "",
        `Telefon: ${contactInfo.phone?.value ?? ""}`,
        "Bu metin genel bilgilendirme amaçlı hazırlanmıştır. İşletmenin resmî hukuki bilgileri netleştirildiğinde gerektiğinde güncellenecektir.",
      ],
    },
  ],
};
