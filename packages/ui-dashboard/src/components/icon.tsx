import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Compass,
  CreditCard,
  Crown,
  Flag,
  Folder,
  Hammer,
  Heart,
  Home,
  Key,
  Landmark,
  Medal,
  MessageCircle,
  Package,
  Plus,
  Radio,
  Scale,
  Scroll,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';

export const DASHBOARD_ICONS = {
  crown: Crown,
  shield: Shield,
  key: Key,
  folder: Folder,
  landmark: Landmark,
  hammer: Hammer,
  search: Search,
  radio: Radio,
  settings: Settings,
  scroll: Scroll,
  'bar-chart': BarChart3,
  users: Users,
  'user-cog': UserCog,
  flag: Flag,
  scale: Scale,
  'credit-card': CreditCard,
  compass: Compass,
  bell: Bell,
  home: Home,
  tag: Tag,
  plus: Plus,
  'shopping-cart': ShoppingCart,
  wallet: Wallet,
  'message-circle': MessageCircle,
  medal: Medal,
  heart: Heart,
  package: Package,
} as const satisfies Record<string, LucideIcon>;

export type DashboardIconName = keyof typeof DASHBOARD_ICONS;

export interface IconProps {
  name: DashboardIconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 18 }: IconProps) {
  const LucideIconComponent = DASHBOARD_ICONS[name];
  return <LucideIconComponent className={className} size={size} aria-hidden />;
}
