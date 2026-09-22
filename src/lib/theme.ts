export type Theme = "dark" | "light";

export type Colors = {
  bg: string;
  surface: string;
  card: string;
  border: string;
  dim: string;
  orange: string;
  violet: string;
  cyan: string;
  text: string;
  muted: string;
  danger: string;
  inputBg: string;
};

export function getColors(theme: Theme): Colors {
  if (theme === "dark") {
    return {
      bg:      "#07071a",
      surface: "#0d0d24",
      card:    "#11112a",
      border:  "#1c1c3a",
      dim:     "#252548",
      orange:  "#ff5500",
      violet:  "#7c3aed",
      cyan:    "#22d3ee",
      text:    "#e8e8f4",
      muted:   "#5a5a82",
      danger:  "#ef4444",
      inputBg: "#0b0b1e",
    };
  }
  return {
    bg:      "#f0eff6",
    surface: "#ffffff",
    card:    "#f7f6fc",
    border:  "#e2e0ee",
    dim:     "#ebebf5",
    orange:  "#e84a00",
    violet:  "#6d28d9",
    cyan:    "#0284c7",
    text:    "#0d0c1e",
    muted:   "#6b6989",
    danger:  "#dc2626",
    inputBg: "#fcfcff",
  };
}
