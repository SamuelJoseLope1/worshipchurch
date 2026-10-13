export const OWNER_EMAIL = "samueljoselopegames@gmail.com";
export const isOwnerEmail = (e?: string | null) => (e ?? "").toLowerCase() === OWNER_EMAIL;
