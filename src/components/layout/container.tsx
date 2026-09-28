import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidthClassName?: string;
}

/** Sayfa içeriğini yatayda ortalayıp maksimum genişlik/kenar boşluğu uygulayan temel sarmalayıcı. */
export function Container({
  children,
  className = "",
  maxWidthClassName = "max-w-5xl",
}: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${maxWidthClassName} px-6 ${className}`.trim()}>{children}</div>
  );
}

/** Sayfa gövdesi için `<main>` + `Container` + standart dikey boşluk birleşimi. */
export function PageContainer({
  children,
  className = "",
  maxWidthClassName = "max-w-5xl",
}: ContainerProps) {
  return (
    <main className="flex flex-1 flex-col">
      <Container
        maxWidthClassName={maxWidthClassName}
        className={`flex flex-1 flex-col py-16 ${className}`.trim()}
      >
        {children}
      </Container>
    </main>
  );
}
