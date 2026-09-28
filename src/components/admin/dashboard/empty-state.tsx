/** Dashboard bölümlerinin ortak "veri yok" durumu — sahte içerik/örnek satır YOK, yalnızca dürüst mesaj. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div role="status" className="border-border-muted text-foreground/60 rounded-md border p-6 text-center text-sm">
      {message}
    </div>
  );
}
