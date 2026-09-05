import Image from "next/image";

export const brandAssets = { primary: "/assets/brand/logo/praxref-primary.png" } as const;
export function BrandLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) { return <Image className={`brand-logo ${className}`} src={brandAssets.primary} alt="PRAXREF — Dikkati çalıştır. Gelişimi takip et." width={1254} height={1254} priority={priority} sizes="(max-width: 768px) 90px, 150px" />; }
