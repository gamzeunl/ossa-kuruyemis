"use client";

import Link from "next/link";
import { useState, useTransition, type DragEvent } from "react";
import { reorderHomepageSectionsAction, toggleHomepageSectionActiveAction } from "@/actions/admin-homepage-sections";
import { useToast } from "@/components/admin/toast-provider";
import type { HomepageSectionConfig } from "@/lib/homepage-sections";

export interface HomepageSectionRowData extends HomepageSectionConfig {
  isActive: boolean;
  /** Gerçek DB verisinden hesaplanmış kısa özet (ör. "5 slayt", "2 ürün seçili") — sahte/statik değildir. */
  summary: string;
}

/**
 * Ana sayfa bölüm sırası/görünürlüğü yönetimi — sürükle-bırak (fare) VE
 * yukarı/aşağı butonları (klavye/dokunmatik erişilebilirlik, bkz. görev
 * kuralı "drag-drop varsa klavye fallback ekle") birlikte sunulur. Her
 * değişiklik iyimser (optimistic) uygulanır, sunucu action'ı başarısız
 * olursa önceki sıraya geri alınır.
 */
export function HomepageSectionManager({ initialSections }: { initialSections: HomepageSectionRowData[] }) {
  const [sections, setSections] = useState(initialSections);
  const [isPending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  function persistOrder(next: HomepageSectionRowData[]) {
    const previous = sections;
    setSections(next);
    startTransition(async () => {
      const result = await reorderHomepageSectionsAction(next.map((section) => section.key));
      if (!result.ok) {
        setSections(previous);
        showToast(result.message, "error");
        return;
      }
      showToast("Ana sayfa sırası güncellendi.");
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) {
      return;
    }
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...sections];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    persistOrder(next);
  }

  function handleToggle(key: string, nextActive: boolean) {
    const previous = sections;
    setSections((current) => current.map((s) => (s.key === key ? { ...s, isActive: nextActive } : s)));
    startTransition(async () => {
      const result = await toggleHomepageSectionActiveAction(key, nextActive);
      if (!result.ok) {
        setSections(previous);
        showToast(result.message, "error");
        return;
      }
      showToast(nextActive ? "Bölüm aktif edildi." : "Bölüm pasif yapıldı.");
    });
  }

  return (
    <ul className="flex flex-col gap-2" aria-label="Ana sayfa bölümleri">
      {sections.map((section, index) => (
        <li
          key={section.key}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event: DragEvent) => event.preventDefault()}
          onDrop={() => handleDrop(index)}
          className="border-border-muted bg-surface flex flex-wrap items-center gap-3 rounded-xl border p-4"
        >
          <div className="flex flex-col gap-1" aria-hidden="true">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0 || isPending}
              aria-label={`${section.label} bölümünü yukarı taşı`}
              className="border-border-muted hover:border-brand flex h-6 w-6 items-center justify-center rounded border text-xs disabled:cursor-not-allowed disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === sections.length - 1 || isPending}
              aria-label={`${section.label} bölümünü aşağı taşı`}
              className="border-border-muted hover:border-brand flex h-6 w-6 items-center justify-center rounded border text-xs disabled:cursor-not-allowed disabled:opacity-30"
            >
              ↓
            </button>
          </div>

          <span className="text-foreground/30 cursor-grab text-lg select-none" aria-hidden="true">
            ⠿
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">{section.label}</p>
            <p className="text-foreground/50 text-xs">{section.summary}</p>
          </div>

          {section.toggleable ? (
            <label className="flex items-center gap-2 text-xs font-semibold">
              <span className={section.isActive ? "text-green-700" : "text-foreground/50"}>
                {section.isActive ? "Aktif" : "Pasif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={section.isActive}
                aria-label={`${section.label} bölümünü ${section.isActive ? "pasif yap" : "aktif yap"}`}
                onClick={() => handleToggle(section.key, !section.isActive)}
                disabled={isPending}
                className={`relative h-5 w-9 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  section.isActive ? "bg-brand" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    section.isActive ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          ) : (
            <span className="text-foreground/40 text-xs font-medium">Her zaman aktif</span>
          )}

          {section.editHref ? (
            <Link
              href={section.editHref}
              className="border-border-muted hover:border-brand min-h-8 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            >
              Düzenle
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
