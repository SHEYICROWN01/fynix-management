import {
  Banknote, PiggyBank, Users, UsersRound, BarChart3, Settings2, Wallet, ShieldCheck, TrendingUp, Handshake, Landmark,
  CalendarDays, HandCoins, Sprout, Home, Briefcase, CreditCard, Smartphone, Clock, Target, type LucideIcon,
} from "lucide-react";
import type { IconKey } from "./types";

export const ICONS: Record<IconKey, LucideIcon> = {
  loans: Banknote,
  savings: PiggyBank,
  customers: Users,
  members: UsersRound,
  reports: BarChart3,
  operations: Settings2,
  wallet: Wallet,
  shield: ShieldCheck,
  growth: TrendingUp,
  handshake: Handshake,
  building: Landmark,
  calendar: CalendarDays,
  contributions: HandCoins,
  farm: Sprout,
  home: Home,
  briefcase: Briefcase,
  card: CreditCard,
  phone: Smartphone,
  clock: Clock,
  target: Target,
};

export const ICON_KEYS = Object.keys(ICONS) as IconKey[];

export const iconFor = (k: string): LucideIcon => ICONS[k as IconKey] ?? ShieldCheck;
