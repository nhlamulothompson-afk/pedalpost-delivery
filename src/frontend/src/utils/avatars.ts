export interface AvatarInfo {
  id: string;
  name: string;
  path: string;
}

export const AVATARS: AvatarInfo[] = [
  {
    id: "cyber-helmet-01",
    name: "Cyber Helmet Blue",
    path: "/assets/generated/avatar-cyber-helmet-01.dim_256x256.png",
  },
  {
    id: "cyber-helmet-02",
    name: "Cyber Helmet Red",
    path: "/assets/generated/avatar-cyber-helmet-02.dim_256x256.png",
  },
  {
    id: "street-hoodie-01",
    name: "Street Hoodie Dark",
    path: "/assets/generated/avatar-street-hoodie-01.dim_256x256.png",
  },
  {
    id: "street-hoodie-02",
    name: "Street Hoodie Light",
    path: "/assets/generated/avatar-street-hoodie-02.dim_256x256.png",
  },
  {
    id: "classic-helmet-01",
    name: "Classic Helmet White",
    path: "/assets/generated/avatar-classic-helmet-01.dim_256x256.png",
  },
  {
    id: "classic-helmet-02",
    name: "Classic Helmet Black",
    path: "/assets/generated/avatar-classic-helmet-02.dim_256x256.png",
  },
  {
    id: "future-visor-01",
    name: "Future Visor Blue",
    path: "/assets/generated/avatar-future-visor-01.dim_256x256.png",
  },
  {
    id: "future-visor-02",
    name: "Future Visor Orange",
    path: "/assets/generated/avatar-future-visor-02.dim_256x256.png",
  },
  {
    id: "rally-goggles-01",
    name: "Rally Goggles Green",
    path: "/assets/generated/avatar-rally-goggles-01.dim_256x256.png",
  },
  {
    id: "rally-goggles-02",
    name: "Rally Goggles Yellow",
    path: "/assets/generated/avatar-rally-goggles-02.dim_256x256.png",
  },
  {
    id: "mono-mask-01",
    name: "Mono Mask Dark",
    path: "/assets/generated/avatar-mono-mask-01.dim_256x256.png",
  },
  {
    id: "mono-mask-02",
    name: "Mono Mask Light",
    path: "/assets/generated/avatar-mono-mask-02.dim_256x256.png",
  },
];

export const DEFAULT_AVATAR_ID = "cyber-helmet-01";

export function getAvatarPath(avatarId: string): string {
  const avatar = AVATARS.find((a) => a.id === avatarId);
  if (!avatar) {
    const defaultAvatar = AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID);
    return defaultAvatar?.path || AVATARS[0].path;
  }
  return avatar.path;
}

export function getAvatarName(avatarId: string): string {
  const avatar = AVATARS.find((a) => a.id === avatarId);
  return avatar?.name || "Unknown Avatar";
}
