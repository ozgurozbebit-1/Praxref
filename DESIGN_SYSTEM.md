# PRAXREF Design System

## Marka kişiliği
PRAXREF; bilimsel netliği sıcak, sakin ve çocuk dostu bir dijital deneyimle birleştirir. Premium ama mesafesiz, oyunlaştırılmış ama oyuncaklaşmayan bir sağlık teknolojisi markasıdır. Arayüz; güven, ilerleme ve özen duygusunu küçük, anlaşılır anlarla kurar.

## Renk paleti
Ana eksen güven veren lacivert-teal tonlarıdır. `--praxref-primary` (#176B7A) ana eylem ve odak rengi; `--praxref-secondary` (#264A74) klinik derinlik rengi; `--praxref-accent` (#E8945D) sıcak vurgu rengidir. Çocuk yüzünde kontrollü mercan, lila ve sarı görev alanı olarak kullanılır; klinisyen yüzünde yüzeyler ve nötr tonlar baskındır. Tüm metin/zemin kombinasyonları AA kontrast hedefiyle seçilmiştir.

## Tipografi
Sistem fontları (Inter benzeri) kullanılır. Başlıklar 700–800 ağırlıkta, dar negatif harf aralığıyla; gövde 400–500 ağırlıkta ve en az 14px'tir. Hiyerarşi `display`, `h1`, `h2`, body, label düzenindedir; salt renkle anlam aktarılmaz.

## Temel tokenlar
- Spacing: 4px tabanı; 8, 12, 16, 24, 32, 48, 64 ölçeği.
- Radius: küçük 10px, kontrol 14px, kart 20px, kahraman/oyun alanı 28px, tam yuvarlak 999px.
- Shadow: yumuşak ve düşük kontrastlı `0 12px 32px rgba(24, 50, 69, .08)`; gölge yalnızca katman ayrımı için kullanılır.
- Border: nötr `--praxref-border`; kartların temel ayrıştırıcısı border ve ton farkıdır, gölge değil.

## Bileşenler
Butonlar birincil, ikincil ve hayalet varyantlarıyla 44px minimum dokunma alanına sahiptir. Kartlar beyaz yüzey, 1px border ve tutarlı 20px radius kullanır. Formlar görünür label, odak halkası ve hata/yardım metni içerir. Badge, pill ve trendler kısa durum bilgisini her zaman metinle destekler.

## Rol bazlı görsel dil
- **Çocuk:** Büyük görev kartları, seyrek metin, yumuşak illüstratif şekiller, keşif ve ilerleme dili. Kırmızı başarısızlık dili ve klinik skor yoktur.
- **Ebeveyn:** Sade haftalık ritim, destekleyici açıklamalar ve yargısız ilerleme özeti. Tanı, kesin sonuç ve risk dili kullanılmaz.
- **Klinisyen:** Nötr yüzeyler, yüksek bilgi yoğunluğu, okunaklı tablolar, trendler ve metinli durum göstergeleri.

## Yaş segmentleri
**Praxref Kids (6–11 yaş)**, sıcak gökyüzü/teal ekseni, daha büyük keşif alanları ve Çağan/Defne karakterleriyle desteklenir. **Praxref Teen (12–17 yaş)**, aynı marka ailesinde daha derin lacivert/lila tonları, daha olgun challenge dili ve Yusuf/Yaren karakterleriyle sunulur. Segment farkı yalnızca renkle anlatılmaz; metin tonu, görsel yoğunluk ve kart ritmi de değişir. Klinik panel iki segmentte de nötr, ortak görünümü korur.

## Logo kullanımı
Ana logo `public/assets/brand/logo/praxref-primary.png` üzerinden `BrandLogo` bileşeniyle bağlanır. Tam renkli logo açık yüzeylerde kullanılır; koyu zemin, açık zemin ve ikon-only varyantları teslim edildiğinde aynı config’e eklenir. Header kompakt, landing görünür, login sakin kullanıma sahiptir; clinician, parent ve play alanlarında header standardı korunur. Slogan: “Dikkati çalıştır. Gelişimi takip et.”

## Grafik ve oyun ilkeleri
Grafikler sade eksen, bağlam etiketi, başlangıca göre değişim ve metinli trend durumuyla sunulur; dekoratif grid veya 3D grafik yoktur. Oyun ekranlarında her görev tek bir ana eyleme, görünür ilerlemeye ve isteğe bağlı ödül anına sahiptir. Ödüller katılımı kutlar, baskı veya bağımlılık döngüsü kurmaz.

## Accessibility
WCAG 2.2 AA hedeflenir: klavyeyle kullanılabilir kontroller, görünür `:focus-visible`, en az 44px dokunma hedefi, anlam için renk dışı ipuçları, semantik başlıklar ve responsive metin ölçekleri kullanılır. Animasyonlar kısa, işlevsel ve `prefers-reduced-motion` tercihiyle kapatılabilir.

## Motion
Geçişler 160–240ms ease-out aralığında tutulur; kart hover'ı 150–220ms hafif yükselme ile sınırlıdır. İlerleme dolumu yumuşaktır, achievement tek seferlik kontrollü bounce kullanabilir ve gelecekteki karakter idle animasyonu ayrı bir slotta kalır. Otomatik kayan içerik, shake, flash, strobe, yoğun parallax ve sürekli bounce kullanılmaz. `prefers-reduced-motion` ile tüm işlevsel olmayan hareket durdurulur.
