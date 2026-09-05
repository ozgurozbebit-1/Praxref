# PRAXREF Asset Guide

## Klasör yapısı
- `brand/logo/`: gerçek logo dosyaları; mevcut `praxref-primary.png` tam renkli ana markadır.
- `brand/guidelines/`: koyu/açık zemin, icon-only ve minimum kullanım belgeleri.
- `reference/`: Çağan/Defne ve Yusuf/Yaren panoları, `praxref-character-lineup.png` ve `praxref-game-world-board.png`. Bunlar yalnızca stil/karakter veya oyun art-direction referansıdır; UI’a büyük görsel olarak basılmaz. Oyun panosu; premium 3D kalite, ışık, sahne zenginliği ve Kids/Teen yönü için rehberdir, gerçek hero asset değildir.
- `characters/kids/{cagan,defne,duo}` ve `characters/teen/{yusuf,yaren,duo}`: şeffaf tekil karakter dosyaları.
- `characters/counselor/`: yetişkin rehber asset’leri; mevcut master dosya `selale-master.png`dir.
- `games/<game-slug>/{kids,teen}` ve `landing/{kids,teen}`: segmente bağlı sahne dosyaları.
- `rewards/`: rozet ve başarı asset’leri.

## Adlandırma ve format
Küçük harf kebab-case kullanın: `cagan-focus-v1.webp`, `yaren-success-v1.png`, `focus-hunt-teen-hero-v1.webp`. Durum ekleri: `welcome`, `focus`, `success`, `retry`, `complete`, `new-level`, `reward`. 3D sahneler WebP; alpha içeren karakter cutout’lar PNG/WebP olmalıdır. Var olan dosyayı ezmek yerine sürüm numarasını artırın.

Mevcut bağlı temel dosyalar: `cagan-master.png`, `defne-master.png`, `yusuf-master.png`, `yaren-master.png`, `kids-duo-master.png`, `teen-duo-master.png` ve `selale-master.png`. Tekil ve duo master dosyaları karşılama pozu olarak tutulur; gelecekteki durum pozları aynı klasörde durum ekiyle eklenir.

## Ölçü ve kullanım
Thumbnail 640×480px; oyun kartı 960×720px; hero 1920×1440px; karakter cutout en az 1200×1600px. Retina kaynaklar hedef CSS ölçüsünün 2× çözünürlüğündedir. Şeffaf karakterlerin temas noktası, kamera yüksekliği, oranı ve ışık yönü aynı karakterin tüm pozlarında korunur.

## Logo standardı
Tam renk logo açık yüzeyde kullanılır. Koyu zemin, açık zemin ve icon-only varyantları geldiklerinde `brand/logo/` içine `praxref-dark`, `praxref-light`, `praxref-mark` adlarıyla eklenir ve `BrandLogo` config’ine bağlanır. Header kompakt; landing görünür; login küçük ve sakin kullanır. Slogan: “Dikkati çalıştır. Gelişimi takip et.”

## Erişilebilirlik ve optimizasyon
Her anlamlı görsel alt metin alır; dekoratif asset boş alt metinle işaretlenir. Renk tek başına durum anlatmaz. Gereksiz metadata temizlenir, içerik uygun boyut/sizes ile sunulur.
