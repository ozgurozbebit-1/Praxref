export const children = [
  { id: "deniz-y", name: "Deniz Y.", age: 8, audience: "kids" as const, initials: "DY", last: "Henüz oturum yok", adherence: 0, s: [0, 0, 0, 0] },
  { id: "elif-k", name: "Elif K.", age: 9, audience: "kids" as const, initials: "EK", last: "Henüz oturum yok", adherence: 0, s: [0, 0, 0, 0] },
  { id: "mert-a", name: "Mert A.", age: 7, audience: "kids" as const, initials: "MA", last: "Henüz oturum yok", adherence: 0, s: [0, 0, 0, 0] },
  { id: "arda-t", name: "Arda T.", age: 14, audience: "teen" as const, initials: "AT", last: "Henüz oturum yok", adherence: 0, s: [0, 0, 0, 0] },
];
export const trend = [0, 0, 0, 0, 0, 0, 0];
export const monthlyTrend = [0, 0, 0, 0, 0, 0, 0];
export const games = [
  ["focus-hunt", "Odak Avı", "Sürdürülen dikkat", "Bir keşif turunda hedefleri bul.", "orbit"],
  ["selective-attention", "Gürültüde Hedef", "Seçici dikkat", "Kalabalığın içinden doğru işareti seç.", "signal"],
  ["inhibition", "Yıldız Savunması", "İnhibisyon", "Sarı yıldızları vur, diğer sembolleri bırak.", "path"],
  ["working-memory", "Akılda Tut", "Çalışma belleği", "İpuçlarını aklında tut ve eşleştir.", "memory"],
  ["praxref-city", "PraxRef City", "Final görev", "Trafiği yönet, hedef rotasını seç ve şehri tamamla.", "city"],
] as const;
