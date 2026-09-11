import type { ComponentType } from "react";
import type { IconKey } from "../../types";
import type { Domain } from "../../types";
import { iconFor } from "../../helpers/categoryIcons";
import type { IconProps } from "./Icons";
import {
  Bitcoin,
  Book,
  Briefcase,
  Building,
  Car,
  Cart,
  Chart,
  Coins,
  CreditCard,
  Family,
  Gift,
  Heart,
  Home,
  Landmark,
  Lifebuoy,
  Monitor,
  Phone,
  Piggy,
  Plane,
  Repeat,
  Shield,
  Shuffle,
  Tag,
  Utensils,
  Wallet,
  Zap,
} from "./Icons";

/** key → drawing. The one place a key becomes pixels. */
export const CATEGORY_ICONS: Record<IconKey, ComponentType<IconProps>> = {
  home: Home,
  family: Family,
  subscriptions: Monitor,
  "credit-card": CreditCard,
  shield: Shield,
  shuffle: Shuffle,
  briefcase: Briefcase,
  building: Building,
  piggy: Piggy,
  lifebuoy: Lifebuoy,
  coins: Coins,
  chart: Chart,
  bitcoin: Bitcoin,
  landmark: Landmark,
  car: Car,
  cart: Cart,
  utensils: Utensils,
  heart: Heart,
  gift: Gift,
  plane: Plane,
  book: Book,
  zap: Zap,
  phone: Phone,
  tag: Tag,
  wallet: Wallet,
  repeat: Repeat,
};

interface Props extends IconProps {
  category: { icon?: IconKey; name: string; domain: Domain };
}

/** A category's icon: its own pick, or the default its name earns. */
export function CategoryIcon({ category, size = 18, ...rest }: Props) {
  const Icon = CATEGORY_ICONS[iconFor(category)];
  return <Icon size={size} {...rest} />;
}
