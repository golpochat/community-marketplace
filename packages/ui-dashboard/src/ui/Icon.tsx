import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Archive,
  Ban,
  BarChart3,
  Bell,
  Check,
  CircleCheck,
  Compass,
  CreditCard,
  Crown,
  Eye,
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
  Pencil,
  Plus,
  Radio,
  Scale,
  Scroll,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  Trash2,
  UserCog,
  UserMinus,
  Users,
  Wallet,
  X,
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
  pencil: Pencil,
  check: Check,
  x: X,
  eye: Eye,
  archive: Archive,
  trash: Trash2,
  ban: Ban,
  'user-minus': UserMinus,
  'alert-triangle': AlertTriangle,
  'circle-check': CircleCheck,
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
