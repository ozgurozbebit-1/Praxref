# PRAXREF Character System

## Temel yaklaşım
PRAXREF karakterleri ilkokul çağındaki çocukların merakını ve sakin özgüvenini yansıtan, modern 3D illustration estetiğine uygun yol arkadaşlarıdır. Bebeksi, aşırı neşeli ya da rekabetçi değillerdir; görev boyunca güven veren bir rehberlik hissi taşırlar.

## Onaylı lineup referansı
`public/assets/reference/praxref-character-lineup.png` tekil UI asset’i değil, karakter kimliği için kanonik referanstır. Soldan sağa sıra sabittir: **Çağan (Kids)**, **Defne (Kids)**, **Yusuf (Teen)**, **Yaren (Teen)**. Referans; yaş oranları, saç silüetleri, kıyafet katmanları, lacivert/pembe/lila destek renkleri, sırt çantası ve cihaz aksesuarlarının tutarlılığı için kullanılır. Tekil master PNG/WebP’ler geldiğinde bu görsel UI’a taşınmadan ilgili karakter klasörlerine bağlanır.

## Bağlı master asset’ler
Çağan, Defne, Yusuf, Yaren ve Şelale master dosyaları ilgili klasörlere bağlanmıştır. Kids duo ve Teen duo master dosyaları da audience’a göre otomatik çözülür. `CharacterArtwork`, explicit `src` verilmediğinde bu varsayılan dosyaları kullanır; fallback yalnızca bir gerçek asset henüz tanımlı değilse devreye girer. Master dosyalar yalnızca `welcome` taban pozu temsil eder; diğer durumlar için aynı karakter kimliğini koruyan ayrı asset’ler sağlanmalıdır.

## Praxref Kids Character System · 6–11 yaş
**Çağan** (erkek) keşif odaklı, dikkatli ve sakin; canlı mavi kapüşonlu üst, koyu kargo pantolon, mavi-turuncu spor ayakkabı ve işlevsel sırt çantasıyla tanınır. **Defne** (kız) meraklı ve destekleyici; yumuşak pembe/beyaz katmanlar, koyu lila alt parça, pembe spor ayakkabı ve tablet/çanta aksesuarıyla tanınır. İkisi de ilkokul çağı hissi, yumuşak yüz hatları, ifadeli fakat abartısız gözler ve belirgin sade silüete sahiptir.

Kullanım alanları: oyun karşılama, odaklanma, kısa başarı, yönlendirme, dinlenme ve duo sahneleri. Pozlar açık avuç, hedefe sakin bakış, hafif öne eğilme ve tek kontrollü kutlama ile sınırlıdır. Bebeksi oranlar, aşırı büyük kafa, parlak plastik/neon ve her asset’te değişen yüz-saç-kıyafet kullanılmaz.

## Praxref Teen Character System · 12–17 yaş
**Yusuf** (erkek) analitik, odaklı ve sorumluluk sahibi; koyu lacivert katmanlar, beyaz logo tişörtü, kulaklık, saat ve olgun sırt çantası detaylarıyla ayrışır. **Yaren** (kız) meraklı, kendinden emin ve empatik; lila/beyaz ceket, rahat mavi denim, mor sırt çantası, saat ve tablet aksesuarını dengeli biçimde taşır. Genç ergen oranları, doğal duruşlar ve daha sakin ifade geçişleri kullanılır.

Kullanım alanları: challenge başlangıcı, planlama, odaklanma, tamamlanan oturum ve rehberlik bağlamı. Duruşlar daha az oyuncu, daha kararlı; ifadeler sıcak fakat ölçülüdür. Yetişkin gibi gösterme, moda/reklam klişesi, anime etkisi, neon gamer estetiği ve tutarsız yaş hissinden kaçınılır.

## İfade, poz ve hareket sistemi
- **Odaklanma:** hafif öne eğilim, sakin kaşlar, gözler hedefte.
- **Başarı:** küçük gülümseme, açık omuzlar, tek kontrollü kutlama hareketi.
- **Zorlanma:** düşünceli ifade; endişe veya başarısızlık dili yok.
- **Dinlenme:** nötr, rahat duruş; içerik bekleme alanlarında kullanılır.
- **Yönlendirme:** açık avuçla işaret etme veya küçük bir hedefe bakış.
- **Birlikte kullanım:** Karakterler eşit ağırlıkta görünür; biri diğerinin çözümünü yapmaz. Duo sahnelerinde yeterli boşluk ve tek ana odak korunur.

Idle animasyon gelecekte 2–3 saniyelik çok hafif nefes alma/bakış döngüsüyle sınırlıdır. Hover 150–220ms, başarı anı tek seferlik kontrollü bounce, progress dolumu yumuşak olmalıdır. `prefers-reduced-motion` aktifken karakterler ve başarı efektleri sabit kalır.

## Görsel tutarlılık
Mat, yumuşak materyaller; klinik-teal, lacivert ve sıcak vurgu paleti; temiz ışık yönü; aşırı detaydan arınmış yüzeyler kullanılır. Kids daha kısa/yuvarlak, Teen daha uzun/doğal vücut oranına sahiptir; iki grupta da gerçekçi olmayan deformasyon kullanılmaz. Her karakter asset’i aynı kamera yüksekliği, oran ve ışık ailesine göre üretilir. Şeffaf PNG/WebP cutout’larda zemine temas noktası korunur.

## Kaçınılacaklar
Aşırı anime etkisi, dev kafa oranları, neon, meme/clipart dili, fiziksel deformasyon, aşırı parlak plastik materyaller, ucuz mobil oyun estetiği ve asset’ler arasında değişen yüz/saç/kıyafet kimliği kullanılmaz.

## Counselor slotu
**Şelale** yetişkin rehber karakteridir; aynı 3D evrende profesyonel, sıcak ve güven verici görünür. Master asset `public/assets/characters/counselor/selale-master.png` olarak bağlıdır. Çocuk ekranlarında otorite figürü değil destekleyici bağlam öğesidir; ebeveyn, guidance ve ileride clinician education içeriklerinde kullanılır.

## Oyun dünyaları
| Oyun | Ana / destek renk | Çevre ve karakter rolü | Kart / arka plan | Başarı ve ilerleme |
| --- | --- | --- | --- | --- |
| Odak Avı | Teal / gökyüzü mavisi | Açık hava keşif, karakter hedefi izler | Geniş ufuk, yumuşak ışık parçacıkları | Tek ışık halkası, sakin yol işaretleri |
| Gürültüde Hedef | Lila / mercan | Kontrollü şehir-pazar, karakter hedefi ayırır | Katmanlı şekiller, okunur ana hedef | Hedef çevresinde ince çerçeve, filtrelenen kalabalık |
| Dur–Git | Mercan / altın | Hareket kontrol pisti, karakter sinyali gözler | Geometrik pist ve sinyal noktaları | Tek onay ışığı, kısa rota bölümü |
| Akılda Tut | Gece mavisi / lila | Hafıza odası, karakter diziyi inceler | Işıklı paneller, sakin gizem | Nazik parıltı, bağlanan sıra düğümleri |

İkonlar basit, yuvarlatılmış ve tek ana metafora dayanır; metin, renk ve ikon birlikte anlam taşır.

`public/assets/reference/praxref-game-world-board.png`, bu dünyaların yalnızca konsept/art-direction referansıdır. Gerçek oyun UI’ında kullanılmaz; her oyun ve audience için ayrı hero asset sağlandığında `games/<game-slug>/<audience>/` klasörüne bağlanır.
