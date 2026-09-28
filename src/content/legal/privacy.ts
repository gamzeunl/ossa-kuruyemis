import type { LegalPageContent } from "@/lib/legal-content";

/**
 * Bu içerik, kod tabanında GERÇEKTEN var olan davranışlar incelenerek yazıldı.
 * Analytics/reklam/pazarlama çerezi veya canlı ödeme entegrasyonu gibi kodda
 * bulunmayan hiçbir davranış varmış gibi anlatılmaz. Sipariş/adres/favori/
 * yorum verilerinin artık gerçekten sunucuda saklandığı (checkout ve
 * `/hesabim/adresler` canlı) bu metne yansıtılmıştır — önceki taslak bunları
 * henüz gelecek zaman ("devreye alındığında") anlatıyordu, artık doğru değildi.
 */
export const privacyContent: LegalPageContent = {
  path: "/gizlilik-politikasi",
  title: "Gizlilik Politikası",
  seoTitle: "Gizlilik Politikası | OSSA Kuruyemiş",
  description:
    "OSSA Kuruyemiş'in hangi verileri hangi amaçla işlediğine dair, gerçek teknik altyapıya dayanan açıklama.",
  sections: [
    {
      heading: "1. Politikanın Amacı",
      paragraphs: [
        "Bu Gizlilik Politikası, OSSA Kuruyemiş internet sitesini kullanırken hangi kişisel verilerinizin toplandığını, hangi amaçlarla işlendiğini, kimlerle paylaşılabileceğini ve haklarınızı açıklamak amacıyla hazırlanmıştır. Kişisel verilerin işlenmesine ilişkin daha ayrıntılı bilgi için KVKK Aydınlatma Metni sayfamıza bakabilirsiniz — bu iki sayfa birbirinin yerini tutmaz, birlikte okunmalıdır.",
      ],
    },
    {
      heading: "2. Toplanan Bilgiler",
      paragraphs: ["Web sitemiz üzerinden aşağıdaki bilgi kategorileri toplanabilir:"],
      list: [
        "Hesap bilgileri: üyelik oluştururken paylaştığınız ad, soyad, e-posta adresi ve isteğe bağlı telefon numarası; şifreniz okunabilir biçimde değil, güvenli şekilde saklanır.",
        "Adres bilgileri: hesabınıza kaydettiğiniz veya sipariş sırasında girdiğiniz teslimat/fatura adresi, ad soyad ve telefon bilgileri.",
        "Sipariş bilgileri: sipariş içeriği (ürün, adet, fiyat), sipariş durumu ve — kurumsal fatura talep ettiyseniz — şirket unvanı, vergi dairesi ve vergi numarası.",
        "Sepet verileri: sepetinize eklediğiniz ürünler, siparişi tamamlayana kadar yalnızca tarayıcınızın yerel deposunda (localStorage) tutulur; sunucularımıza gönderilmez.",
        "İletişim talepleri: iletişim/toplu sipariş formunu doldurduğunuzda ad soyad, telefon ve/veya e-posta, talep türü, isteğe bağlı etkinlik tarihi/kişi sayısı ve mesajınız.",
        "Ürün değerlendirmeleri ve favoriler: hesabınızla yaptığınız ürün yorumları/puanları ve favori ürün listeniz.",
        "Oturum verileri: giriş yaptığınızda oluşturulan oturum kaydı; güvenlik ve oturum yönetimi amacıyla IP adresi ve tarayıcı (user-agent) bilgisi içerebilir.",
      ],
    },
    {
      heading: "3. Bilgilerin Kullanım Amaçları",
      paragraphs: [
        "Toplanan bilgiler; üyelik ve hesap işlemlerinin yürütülmesi, sipariş ve teslimat süreçlerinin gerçekleştirilmesi, iletişim taleplerinizin yanıtlanması, ürün değerlendirmelerinin yayınlanması ve site/hesap güvenliğinin sağlanması amaçlarıyla kullanılır.",
      ],
    },
    {
      heading: "4. Bilgilerin Paylaşılması",
      paragraphs: [
        "Bilgileriniz; siparişinizin teslim edilebilmesi için kargo/lojistik iş ortaklarımızla, sitemizin barındırılması için altyapı sağlayıcılarımızla ve yasal bir zorunluluk bulunması hâlinde yetkili kamu kurumlarıyla paylaşılabilir. Bunların dışında üçüncü taraflarla paylaşılmaz.",
        "Sitede şu an aktif bir çevrimiçi ödeme alma özelliği bulunmamaktadır; bu nedenle kart bilgileriniz hiçbir ödeme sağlayıcısına iletilmemektedir. Ödeme altyapısı devreye alındığında, ödeme işlemi doğrudan lisanslı bir ödeme hizmeti sağlayıcısı üzerinden yürütülecek ve bu politika o aşamada güncellenecektir.",
      ],
    },
    {
      heading: "5. Veri Güvenliği",
      paragraphs: [
        "Şifreniz güvenli (geri döndürülemez) biçimde saklanır. Kart bilgileriniz hiçbir zaman OSSA Kuruyemiş sunucularında veya veritabanında saklanmaz/saklanmayacaktır. Hesabınıza erişim, oturum yönetimi ile korunur.",
      ],
    },
    {
      heading: "6. Saklama",
      paragraphs: [
        "Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amacının gerektirdiği süre boyunca saklanır. Hesap bilgileriniz hesabınız aktif olduğu sürece, sipariş kayıtlarınız ise ticari/vergisel mevzuatın öngördüğü yasal süreler boyunca muhafaza edilir.",
      ],
    },
    {
      heading: "7. Çerezler ve Tarayıcı Depolama Teknolojileri",
      paragraphs: ["Sitemizde şu an kullanılan tarayıcı depolama teknolojileri şunlardır:"],
      list: [
        "Oturum çerezi: giriş yaptığınızda oturumunuzu sürdürmek için teknik ve zorunlu nitelikte bir çerez kullanılır.",
        "Sepet (localStorage): sepetinizdeki ürünler tarayıcınızın yerel deposunda (\"ossa-cart\" anahtarı) tutulur; tarayıcı verilerinizi temizlediğinizde veya farklı bir cihaz/tarayıcı kullandığınızda sepetiniz görünmeyebilir.",
        "Kampanya bildirimi (sessionStorage): bir kampanya bilgilendirme penceresini gördüğünüzü hatırlamak için, yalnızca o oturum/sekme boyunca geçerli teknik bir kayıt tutulur.",
        "Sitede şu an analiz (analytics), reklam veya pazarlama amaçlı herhangi bir çerez ya da izleme kodu kullanılmamaktadır. İleride bu tür isteğe bağlı çerezler eklenirse, açık rızanız ayrıca ve önceden alınacaktır.",
      ],
    },
    {
      heading: "8. Haklar ve İletişim",
      paragraphs: [
        "Kişisel verilerinizin işlenmesine ilişkin haklarınız ve başvuru yollarına dair ayrıntılı bilgi için KVKK Aydınlatma Metni sayfamıza bakabilirsiniz. Sorularınız için İletişim sayfamızdan bize ulaşabilirsiniz.",
      ],
    },
    {
      heading: "9. Politika Güncellemeleri",
      paragraphs: [
        "Bu politika, sitemizdeki özellik değişikliklerine (ör. canlı ödeme altyapısının devreye alınması) paralel olarak güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır.",
      ],
    },
  ],
};
