import { businessLegalInfo } from "@/lib/business-info";
import type { LegalPageContent } from "@/lib/legal-content";

/**
 * Canlı ödeme entegrasyonu henüz olmadığı için burada gösterilen, gerçek bir
 * siparişe bağlı NİHAİ sözleşme DEĞİLDİR — genel taslak yapıdır. SATICI
 * bilgileri `businessLegalInfo`'dan (bkz. src/lib/business-info.ts) gelir;
 * yalnızca DOĞRULANMIŞ alanlar (işletme/marka adı, yetkili adı, adres,
 * telefon) yazılır — vergi dairesi/no ve MERSİS henüz doğrulanmadığından bu
 * satırlar hiç eklenmez (uydurulmaz).
 */
export const distanceSalesContent: LegalPageContent = {
  path: "/mesafeli-satis-sozlesmesi",
  title: "Mesafeli Satış Sözleşmesi",
  seoTitle: "Mesafeli Satış Sözleşmesi | OSSA Kuruyemiş",
  description:
    "Mesafeli satış sözleşmesinin genel taslak yapısı ve sipariş sırasında nasıl oluşturulacağına dair bilgilendirme.",
  notice:
    "Bu sayfa, mesafeli satış sözleşmesinin genel taslak yapısını gösterir. Gerçek bir sipariş oluşturduğunuzda, alıcı, ürün, fiyat ve teslimat bilgileriniz sipariş özetinde size ayrıca gösterilir. Satıcının resmî vergi/MERSİS bilgileri ve canlı ödeme altyapısı tamamlanmadan bu sayfa nihai/eksiksiz bir sözleşme niteliği taşımaz; hukuki inceleme ile son haline getirilecektir.",
  sections: [
    {
      heading: "1. Taraflar",
      paragraphs: [
        `SATICI: ${businessLegalInfo.displayName} (${businessLegalInfo.proprietorName})`,
        `Adres: ${businessLegalInfo.address}`,
        `Telefon: ${businessLegalInfo.phone}`,
        "ALICI: Sipariş sırasında girdiğiniz ad soyad, teslimat adresi ve iletişim bilgileriniz.",
      ],
    },
    {
      heading: "2. Sözleşmenin Konusu",
      paragraphs: [
        "Bu sözleşme, ALICI'nın OSSA Kuruyemiş internet sitesi üzerinden elektronik ortamda sipariş verdiği ürün(ler)in satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler.",
      ],
    },
    {
      heading: "3. Ürün ve Sipariş Bilgileri",
      paragraphs: [
        "Sipariş konusu ürün(ler)in adı, adedi, birim fiyatı ve toplam tutarı, sipariş onayından önce ödeme sayfasındaki Sipariş Özeti'nde ALICI'ya gösterilir ve bu sözleşmenin ayrılmaz eki sayılır.",
      ],
    },
    {
      heading: "4. Fiyat ve Ödeme",
      paragraphs: [
        "Toplam sipariş bedeli; ürün fiyatları, varsa kargo ücreti ve diğer masraflar dahil olmak üzere sipariş onayından önce ALICI'ya açıkça gösterilir.",
        "Ödeme yöntemi ve ödeme hizmeti sağlayıcısı, canlı ödeme altyapısı devreye alındığında burada belirtilecektir. Kart bilgileri hiçbir zaman OSSA Kuruyemiş tarafından saklanmaz.",
      ],
    },
    {
      heading: "5. Teslimat",
      paragraphs: [
        "Teslimat süreci ve genel esaslar için Teslimat ve İade sayfamıza bakabilirsiniz. Kesin bir teslimat süresi bu sözleşmede taahhüt edilmemektedir.",
      ],
    },
    {
      heading: "6. Cayma Hakkı",
      paragraphs: [
        "ALICI, mevzuatın öngördüğü haller saklı kalmak kaydıyla, teslim aldığı üründen belirli bir süre içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahip olabilir. Cayma hakkının kullanım süresi ve usulü, yürürlükteki tüketici mevzuatına göre netleştirildiğinde bu bölümde ayrıntılı olarak belirtilecektir.",
      ],
    },
    {
      heading: "7. Cayma Hakkının İstisnaları",
      paragraphs: [
        "Yürürlükteki Mesafeli Sözleşmeler Yönetmeliği uyarınca; niteliği itibarıyla iade edilemeyecek, çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler ile ambalajı/hijyen kapağı açılmış ürünlerde cayma hakkı kullanılamayabilir. OSSA Kuruyemiş'in gıda ürünleri bu istisnalar kapsamına girebilir; kesin kapsam hukuki inceleme ile netleştirilecektir.",
      ],
    },
    {
      heading: "8. İade Süreci",
      paragraphs: [
        "İade talebi oluşturma, ürünün iade edilebilir durumda olması ve iade sürecine dair genel bilgiler için Teslimat ve İade sayfamıza bakabilirsiniz.",
      ],
    },
    {
      heading: "9. Ayıplı / Hatalı Ürün",
      paragraphs: [
        "Siparişinizde yanlış, eksik veya hasarlı bir ürün teslim aldıysanız, mümkün olan en kısa sürede bizimle iletişime geçmenizi rica ederiz; bu durumlar tüketici mevzuatı çerçevesinde öncelikli olarak değerlendirilir.",
      ],
    },
    {
      heading: "10. Kişisel Veriler",
      paragraphs: [
        "Bu sözleşme kapsamında işlenen kişisel verileriniz hakkında ayrıntılı bilgi için Gizlilik Politikası ve KVKK Aydınlatma Metni sayfalarımıza bakabilirsiniz.",
      ],
    },
    {
      heading: "11. Uyuşmazlıkların Çözümü",
      paragraphs: [
        "Bu sözleşmeden doğabilecek uyuşmazlıklarda, yürürlükteki tüketici mevzuatı kapsamında yetkili Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri başvurulabilecek mercilerdir. Bu bölümün kesin metni, satıcının vergi/MERSİS bilgileri netleştiğinde ve hukuki danışmanlıkla teyit edildikten sonra tamamlanacaktır.",
      ],
    },
    {
      heading: "12. Yürürlük",
      paragraphs: [
        "Bu genel taslak metin, OSSA Kuruyemiş'in resmî vergi/MERSİS bilgileri ile canlı ödeme altyapısı tamamlanmadan yürürlüğe giren nihai bir sözleşme değildir.",
      ],
    },
  ],
};
