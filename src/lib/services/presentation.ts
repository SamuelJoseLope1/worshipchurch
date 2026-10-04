// PresentationService — pushes slides to a separate display window on the same
// computer (second screen) via BroadcastChannel. Real, no network needed.
export type DisplayTheme = {
  bg: string;
  fg: string;
  size: number;
  font: "sans" | "mono" | "serif";
  align: "left" | "center" | "right";
  bgImage?: string | null;
  overlay?: string | null;
};

export type DisplayMessage =
  | { type: "slide"; title: string; section: string; lines: string[]; theme: DisplayTheme }
  | { type: "blank"; theme: DisplayTheme }
  | { type: "ping" };

export const DEFAULT_THEME: DisplayTheme = {
  bg: "#06090d",
  fg: "#f2f5f7",
  size: 56,
  font: "sans",
  align: "center",
  bgImage: null,
  overlay: null,
};

const NAME = "wcmp-display";

export function displayChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(NAME);
}

export function openDisplayWindow() {
  return window.open("/display", "wcmp-display", "popup,width=1280,height=720");
}
