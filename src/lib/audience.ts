export type Audience = "kids" | "teen";
export const audienceConfig = {
  kids: { label: "Praxref Kids", ages: "6–11 yaş", description: "Oyunlaştırılmış, sıcak ve keşfe dayalı dikkat deneyimi.", characters: ["Çağan", "Defne"], tone: "kids" },
  teen: { label: "Praxref Teen", ages: "12–17 yaş", description: "Daha olgun, modern ve challenge odaklı dikkat deneyimi.", characters: ["Yusuf", "Yaren"], tone: "teen" },
} as const;
