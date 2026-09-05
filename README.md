# PRAXREF
Oyunlaştırılmış dikkat ve bilişsel beceri geliştirme platformu MVP iskeleti. **Praxref Kids** 6–11 yaş için Çağan ve Defne ile, **Praxref Teen** 12–17 yaş için Yusuf ve Yaren ile ayrı görsel deneyimler sunar. Klinisyen paneli her iki segmenti yönetir. Tıbbi tanı veya tedavi aracı değildir.
## Çalıştırma
`pnpm install` · `cp .env.example .env` · `pnpm dev`
PostgreSQL sonrası: `pnpm prisma generate` ve `pnpm prisma migrate dev --name init`.

## Prisma client üretimi

`src/generated/prisma/` Git'e dahil edilmez; şema ve migration dosyaları takip edilir. Bağımlılıklar kurulduktan sonra `pnpm exec prisma generate` ile client yeniden üretilir. Bu komut migration uygulamaz veya veritabanına bağlanmaz; mevcut `prisma.config.ts` yüklenirken `DIRECT_URL` ortam değişkeninin tanımlı olması gerekir. Secret değerlerini repoya eklemeyin.

Mevcut uygulama generated client'ı import etmiyor; `build` scripti yalnızca `next build` çalıştırıyor ve otomatik client üretimi yapmıyor. Client kullanan bir runtime eklendiğinde CI/deploy akışında build öncesine açık bir `pnpm exec prisma generate` adımı eklenmelidir.
