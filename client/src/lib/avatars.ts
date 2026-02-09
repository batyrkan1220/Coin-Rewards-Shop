const AVATAR_STYLES = [
  { style: "adventurer", label: "Приключенец" },
  { style: "adventurer-neutral", label: "Нейтральный" },
  { style: "avataaars", label: "Аватаар" },
  { style: "avataaars-neutral", label: "Аватаар нейтр." },
  { style: "big-ears", label: "Большие уши" },
  { style: "big-ears-neutral", label: "Большие уши нейтр." },
  { style: "lorelei", label: "Лорелей" },
  { style: "lorelei-neutral", label: "Лорелей нейтр." },
  { style: "notionists", label: "Нотионист" },
  { style: "notionists-neutral", label: "Нотионист нейтр." },
  { style: "personas", label: "Персона" },
  { style: "micah", label: "Мика" },
  { style: "miniavs", label: "Мини" },
  { style: "open-peeps", label: "Скетч" },
  { style: "croodles", label: "Крудлс" },
  { style: "croodles-neutral", label: "Крудлс нейтр." },
];

const SEEDS = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"];

export function generateAvatarOptions(username: string): { id: string; url: string; label: string }[] {
  const options: { id: string; url: string; label: string }[] = [];
  for (const { style, label } of AVATAR_STYLES) {
    for (const seed of SEEDS) {
      const avatarSeed = `${username}-${seed}`;
      options.push({
        id: `${style}:${seed}`,
        url: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}&size=80`,
        label,
      });
    }
  }
  return options;
}

export function getAvatarUrl(username: string, avatarStyle?: string | null, gender?: string | null): string {
  if (avatarStyle) {
    const [style, seed] = avatarStyle.split(":");
    const avatarSeed = seed ? `${username}-${seed}` : username;
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}&size=80`;
  }
  if (gender === "female") {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&top=longHairStraight,longHairBob,longHairCurly,longHairMiaWallace&accessories=prescription01,prescription02,round&facialHair=blank`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&top=shortHairShortFlat,shortHairShortWaved,shortHairShortCurly,shortHairDreads01&facialHair=beardLight,beardMedium,moustacheFancy,blank`;
}

export { AVATAR_STYLES, SEEDS };
