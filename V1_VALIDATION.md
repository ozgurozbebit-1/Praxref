# PRAXREF V1 Integration & Validation

## V1 oyun durumu

Odak Avı, Gürültüde Hedef, Dur-Git ve Akılda Tut V1 oyun motorları, Kids/Teen ayarları, yerel oturum kayıtları ve oyun bazlı klinisyen kartları korunur.

## Ortak protokol

`src/lib/protocol` ortak session envelope, cognitive domain, kalite flagleri, metric normalizasyonu ve save öncesi doğrulama sağlar. Oyunlara ait ham summary’ler değiştirilmez; adapter bu summary’leri `UnifiedSession` olarak okur.

## Standardizasyon ve güven

Ortak metrik adları accuracy, omission/commission oranı ve RT istatistikleridir. Güven seviyesi geçerli trial sayısına göre insufficient (<10), low (10–19), moderate (20–39) ve good (40+) olarak atanır. Bu, klinik güven iddiası değildir.

## Clinician görünümü

Clinician dashboard, dört domain için ayrı skor/trend/güven kartları, segment filtresi, yerel/demo etiketi ve son oturumlar alanı sunar. Kids ile Teen skorları birbirine karşılaştırılmaz.

## Doğrulama

Integration testleri mapping, doğrulama, güven seviyesi ve kural tabanlı özeti kapsar. Runtime doğrulaması bağımlılıklar erişilebilir olduğunda `pnpm test`, `pnpm lint` ve `pnpm build` ile tekrar çalıştırılmalıdır.

## Bilinen riskler / sonraki faz

Veriler yalnızca tarayıcı localStorage’ındadır; kalıcı kullanıcı/çocuk eşlemesi veya gerçek klinik yorum yoktur. Sonraki faz auth, güvenli kalıcılık ve onaylı veri aktarımı öncesi gizlilik incelemesini gerektirir.
