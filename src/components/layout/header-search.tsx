"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatPrice } from "@/lib/format-money";
import type { ProductSearchSuggestion } from "@/types/catalog";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

function suggestionHref(slug: string): string {
  return `/urunler/${slug}`;
}

/** "Tüm sonuçları gör" bağlantısı — mevcut arama sonuç rotası (`/urunler?ara=`) korunur. */
function allResultsHref(query: string): string {
  const params = new URLSearchParams();
  params.set("ara", query);
  return `/urunler?${params.toString()}`;
}

interface HeaderSearchProps {
  className?: string;
  inputId: string;
  size?: "default" | "compact";
}

export function HeaderSearch({ className = "", inputId, size = "default" }: HeaderSearchProps) {
  const router = useRouter();
  const isCompact = size === "compact";
  const listboxId = useId();

  const [value, setValue] = useState("");
  const [items, setItems] = useState<ProductSearchSuggestion[]>([]);
  const [fetchError, setFetchError] = useState(false);
  // Sonucu üretilmiş son sorgu — `debouncedValue`'dan farklıysa istek hâlâ
  // sürüyor demektir; bu sayede ayrı bir "loading" state'i tutmaya gerek kalmaz.
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debouncedValue = useDebouncedValue(value.trim(), DEBOUNCE_MS);

  const hasEnoughChars = debouncedValue.length >= MIN_QUERY_LENGTH;
  const showPanel = isOpen && hasEnoughChars;

  const status: SearchStatus = !hasEnoughChars
    ? "idle"
    : resolvedQuery !== debouncedValue
      ? "loading"
      : fetchError
        ? "error"
        : items.length > 0
          ? "success"
          : "empty";

  // Yeni bir sorgu yüklenirken önceki sorgunun vurgulu (highlighted) satırı
  // geçerliliğini yitirir; ayrı bir efekt/state yerine doğrudan türetilir.
  const effectiveHighlightedIndex = status === "success" ? highlightedIndex : -1;

  useEffect(() => {
    if (!hasEnoughChars) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(debouncedValue)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("search request failed");
        }
        return response.json() as Promise<{ items: ProductSearchSuggestion[] }>;
      })
      .then((data) => {
        setItems(data.items);
        setFetchError(false);
        setResolvedQuery(debouncedValue);
        setIsOpen(true);
        setHighlightedIndex(-1);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Yeni bir sorgu başladığı için iptal edildi — eski sonuç yenisinin
          // üzerine yazılmaz, bu isteğin sonucu tamamen yok sayılır.
          return;
        }

        setItems([]);
        setFetchError(true);
        setResolvedQuery(debouncedValue);
        setIsOpen(true);
        setHighlightedIndex(-1);
      });

    return () => controller.abort();
  }, [debouncedValue, hasEnoughChars]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node | null)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function goToSuggestion(slug: string) {
    setIsOpen(false);
    router.push(suggestionHref(slug));
  }

  function goToAllResults(query: string) {
    setIsOpen(false);
    router.push(allResultsHref(query));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" && highlightedIndex < 0) {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        event.preventDefault();
        goToAllResults(trimmed);
      }
      return;
    }

    if (!showPanel || status !== "success") {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % items.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();

      const selectedItem = items[highlightedIndex];

      if (selectedItem) {
        goToSuggestion(selectedItem.slug);
      }
    }
  }

  const liveMessage =
    status === "loading"
      ? "Aranıyor…"
      : status === "success"
        ? `${items.length} sonuç bulundu`
        : status === "empty"
          ? "Sonuç bulunamadı"
          : status === "error"
            ? "Arama önerileri şu anda yüklenemiyor."
            : "";

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <label htmlFor={inputId} className="sr-only">
        Ürün, kategori veya marka ara
      </label>

      <form
        role="search"
        action="/urunler"
        className={`border-border-muted focus-within:border-brand flex overflow-hidden border bg-white transition-shadow focus-within:shadow-[0_0_0_3px_rgba(255,182,0,0.12)] ${
          isCompact ? "h-[48px] rounded-xl" : "h-[52px] rounded-full"
        }`}
      >
        <input
          id={inputId}
          name="ara"
          type="search"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            effectiveHighlightedIndex >= 0
              ? `${listboxId}-option-${effectiveHighlightedIndex}`
              : undefined
          }
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder="Ürün, kategori veya marka ara"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (hasEnoughChars) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`text-foreground placeholder:text-muted-text min-w-0 flex-1 bg-white font-medium outline-none ${
            isCompact ? "px-4 text-sm" : "px-6 text-[15px]"
          }`}
        />

        <button
          type="submit"
          aria-label="Arama yap"
          className={`bg-brand hover:bg-brand-dark flex shrink-0 items-center justify-center text-brand-foreground transition-colors ${
            isCompact ? "w-[52px]" : "w-[58px]"
          }`}
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </form>

      <div aria-live="polite" className="sr-only">
        {showPanel ? liveMessage : ""}
      </div>

      {showPanel ? (
        <div className="border-border-muted absolute top-[calc(100%+8px)] left-0 z-50 max-h-[70vh] w-full min-w-0 overflow-hidden rounded-xl border bg-white shadow-[0_14px_28px_-18px_rgba(0,0,0,0.28)] sm:min-w-[320px]">
          {status === "loading" ? (
            <div className="text-foreground/60 flex items-center gap-2.5 px-4 py-5 text-sm">
              <span
                aria-hidden="true"
                className="border-border-muted border-t-brand h-4 w-4 shrink-0 animate-spin rounded-full border-2"
              />
              Aranıyor…
            </div>
          ) : status === "error" ? (
            <p className="text-foreground/60 px-4 py-5 text-sm">
              Arama önerileri şu anda yüklenemiyor.
            </p>
          ) : status === "empty" ? (
            <div className="flex flex-col gap-3 px-4 py-5">
              <p className="text-foreground/60 text-sm">
                &ldquo;{debouncedValue}&rdquo; ile eşleşen ürün bulunamadı.
              </p>
              <Link
                href="/urunler"
                onClick={() => setIsOpen(false)}
                className="text-brand w-fit text-sm font-semibold underline underline-offset-2"
              >
                Tüm ürünleri görüntüle
              </Link>
            </div>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Ürün önerileri"
              className="max-h-[calc(70vh-52px)] overflow-y-auto py-2"
            >
              {items.map((item, index) => (
                <li
                  id={`${listboxId}-option-${index}`}
                  key={item.id}
                  role="option"
                  aria-selected={index === effectiveHighlightedIndex}
                >
                  <Link
                    href={suggestionHref(item.slug)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-11 items-center gap-3 px-4 py-2 transition-colors ${
                      index === effectiveHighlightedIndex
                        ? "bg-surface-muted"
                        : "hover:bg-surface-muted"
                    }`}
                  >
                    <span className="bg-surface-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      {item.primaryImage ? (
                        <Image
                          src={item.primaryImage.url}
                          alt=""
                          fill
                          unoptimized
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block truncate text-sm font-medium">
                        {item.name}
                      </span>

                      <span className="flex items-center gap-2">
                        {item.categoryName ? (
                          <span className="text-foreground/50 block truncate text-xs">
                            {item.categoryName}
                          </span>
                        ) : null}

                        {item.minPrice ? (
                          <span className="text-brand block shrink-0 text-xs font-semibold">
                            {formatPrice(item.minPrice)}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {status === "success" || status === "empty" || status === "error" ? (
            <Link
              href={allResultsHref(debouncedValue)}
              onClick={() => setIsOpen(false)}
              className="border-border-muted text-brand hover:bg-surface-muted block border-t px-4 py-3 text-center text-sm font-semibold transition-colors"
            >
              Tüm sonuçları gör
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
