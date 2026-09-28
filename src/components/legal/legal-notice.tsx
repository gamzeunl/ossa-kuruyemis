/** KVKK/Mesafeli Satış/Ön Bilgilendirme gibi sayfalarda üstte gösterilen dikkat notu. */
export function LegalNotice({ message }: { message: string }) {
  return (
    <div className="border-gold bg-gold-light/50 text-gold-foreground rounded-xl border px-4 py-3.5 text-sm leading-6">
      {message}
    </div>
  );
}
