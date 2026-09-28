/**
 * Ana metin — editoryal düzen: kontrollü max-width, kısa paragraflar, güçlü
 * ara başlıklar. Tek dev paragraf halinde BASILMAZ.
 */
export function AboutStory() {
  return (
    <section className="flex flex-col gap-8">
      <p className="text-foreground max-w-2xl text-base leading-8 font-medium sm:text-lg">
        OSSA&apos;da bizim için iyi bir alışveriş deneyimi, doğru ürünü sunmakla başlar.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
          Geniş bir seçki, kolay bir deneyim
        </h2>
        <p className="text-foreground/75 max-w-2xl text-sm leading-7 sm:text-base">
          Kuruyemiş, lokum, çikolata, kahve, baharat, hurma ve kuru meyve gibi farklı ürün gruplarını
          bir araya getirirken; ürün seçiminin kolay, sipariş sürecinin anlaşılır ve alışverişin
          güvenli olmasına önem veriyoruz.
        </p>
        <p className="text-foreground/75 max-w-2xl text-sm leading-7 sm:text-base">
          Günlük atıştırmalıklardan misafir ikramlarına, kahve yanına eşlik edecek küçük lezzetlerden
          özel günler için hazırlanacak siparişlere kadar farklı ihtiyaçlara hitap eden bir ürün
          seçkisi sunuyoruz.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
          Özenli hazırlık, güvenli teslimat
        </h2>
        <p className="text-foreground/75 max-w-2xl text-sm leading-7 sm:text-base">
          Ürünlerimizi hazırlarken özenli paketlemeyi, doğru saklama koşullarını ve müşteriye
          ulaşana kadar ürünün korunmasını önemsiyoruz.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
          Bir mağazadan daha fazlası
        </h2>
        <p className="text-foreground/75 max-w-2xl text-sm leading-7 sm:text-base">
          OSSA&apos;yı yalnızca ürünlerin listelendiği bir mağaza olarak değil; aradığınız lezzete
          kolayca ulaşabileceğiniz, güvenle alışveriş yapabileceğiniz ve ihtiyaç duyduğunuzda
          doğrudan iletişim kurabileceğiniz bir marka olarak geliştirmek istiyoruz.
        </p>
      </div>
    </section>
  );
}
