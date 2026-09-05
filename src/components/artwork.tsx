"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ArtworkProps = {
  alt: string;
  src?: ImageProps["src"];
  className?: string;
  aspect?: "hero" | "card" | "portrait" | "wide";
  fit?: "cover" | "contain";
  label?: string;
  priority?: boolean;
};

export function PraxrefImage({ alt, src, className = "", aspect = "card", fit = "cover", label, priority = false }: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <div className={`praxref-image praxref-image--${aspect} ${className}`}><Image src={src} alt={alt} fill priority={priority} onError={() => setFailed(true)} sizes={aspect === "hero" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"} style={{ objectFit: fit }} /></div>;
  return <div className={`praxref-image praxref-image--${aspect} praxref-image--fallback ${className}`} role="img" aria-label={alt}><span className="praxref-image__halo" /><span className="praxref-image__orb" /><span className="praxref-image__spark" />{label && <span className="praxref-image__label">{label}</span>}</div>;
}

const gameLabels = { "focus-hunt": "Keşif ufku", "selective-attention": "Şehir sinyalleri", inhibition: "Hareket pisti", "working-memory": "Hafıza odası" } as const;
const gameAssets: Partial<Record<keyof typeof gameLabels, Partial<Record<"kids" | "teen", string>>>> = { "focus-hunt": { kids: "/assets/games/focus-hunt/kids/focus-hunt-kids-hero.png", teen: "/assets/games/focus-hunt/teen/focus-hunt-teen-hero.png" }, "selective-attention": { kids: "/assets/games/selective-attention/kids/selective-attention-kids-hero.png", teen: "/assets/games/selective-attention/teen/selective-attention-teen-hero.png" }, inhibition: { kids: "/assets/games/inhibition/kids/inhibition-kids-hero.png", teen: "/assets/games/inhibition/teen/inhibition-teen-hero.png" }, "working-memory": { kids: "/assets/games/working-memory/kids/working-memory-kids-hero.png", teen: "/assets/games/working-memory/teen/working-memory-teen-hero.png" } };
export function GameArtwork({ game, audience = "kids", src, alt, className = "", aspect = "card", priority = false }: { game: keyof typeof gameLabels; audience?: "kids" | "teen"; src?: ImageProps["src"]; alt: string; className?: string; aspect?: "card" | "hero"; priority?: boolean }) { const defaultAsset = gameAssets[game]?.[audience]; return <PraxrefImage src={src ?? defaultAsset} alt={alt} aspect={aspect} fit="contain" priority={priority} label={`${audience === "kids" ? "Kids" : "Teen"} · ${gameLabels[game]}`} className={`game-artwork game-artwork--${game} game-artwork--${audience} ${className}`} />; }

type CharacterName = "cagan" | "defne" | "yusuf" | "yaren" | "duo" | "counselor";
const characterAssets: Partial<Record<CharacterName, string>> = { cagan: "/assets/characters/kids/cagan/cagan-master.png", defne: "/assets/characters/kids/defne/defne-master.png", yusuf: "/assets/characters/teen/yusuf/yusuf-master.png", yaren: "/assets/characters/teen/yaren/yaren-master.png", counselor: "/assets/characters/counselor/selale-master.png" };
const duoAssets = { kids: "/assets/characters/kids/duo/kids-duo-master.png", teen: "/assets/characters/teen/duo/teen-duo-master.png" } as const;

export function CharacterArtwork({ audience = "kids", character, state = "welcome", src, alt, className = "" }: { audience?: "kids" | "teen"; character: CharacterName; state?: "welcome" | "success" | "retry" | "complete" | "new-level" | "reward" | "focus" | "rest" | "guide"; src?: ImageProps["src"]; alt: string; className?: string }) { const defaultAsset = character === "duo" ? duoAssets[audience] : characterAssets[character]; return <PraxrefImage src={src ?? defaultAsset} alt={alt} aspect={character === "duo" ? "wide" : "portrait"} fit="contain" label={`${audience} · ${character} · ${state}`} className={`character-artwork character-artwork--${audience} character-artwork--${character} character-artwork--${state} ${className}`} />; }
