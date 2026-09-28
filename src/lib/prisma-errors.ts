import { Prisma } from "@/generated/prisma/client";

function readObjectProperty(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return (value as Record<string, unknown>)[key];
}

/**
 * `@prisma/adapter-pg` (driver adapter) kullanıldığında P2002 hatasının
 * `meta` şekli klasik binary engine'den TAMAMEN FARKLIDIR: `meta.target` yok,
 * bunun yerine `meta.driverAdapterError.cause.constraint.fields` (ham Postgres
 * kısıt alan adları dizisi) doluyor. Her iki şekil de burada desteklenir —
 * hangi motorun kullanıldığına dair varsayım yapılmaz. TEK kaynak — hangi
 * repository'nin hangi benzersizlik ihlaline uğradığını ayırt etmek isteyen
 * her yer (`order-repository.ts`, `product-repository.ts`) bunu kullanır.
 */
export function violatesUniqueConstraintOn(error: unknown, column: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target) && target.some((entry) => String(entry).includes(column))) {
    return true;
  }
  if (typeof target === "string" && target.includes(column)) {
    return true;
  }

  const driverAdapterError = readObjectProperty(error.meta, "driverAdapterError");
  const cause = readObjectProperty(driverAdapterError, "cause");
  const constraint = readObjectProperty(cause, "constraint");
  const fields = readObjectProperty(constraint, "fields");
  if (Array.isArray(fields) && fields.some((entry) => String(entry).includes(column))) {
    return true;
  }

  return false;
}
