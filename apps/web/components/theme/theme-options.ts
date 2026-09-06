import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";

/**
 * The theme choices — the single source shared by the account-menu submenu, the public-pages
 * `ThemeToggle`, and the command palette (add or rename once, ADR 0023). `value` matches
 * `next-themes`' setting.
 */
export type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  icon: LucideIcon;
};

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];
