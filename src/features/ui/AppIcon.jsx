import {
  BadgePercent,
  Banknote,
  BarChart3,
  Boxes,
  Calculator,
  CalendarDays,
  Circle,
  CreditCard,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  StickyNote,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";

const ICONS = {
  BadgePercent,
  Banknote,
  BarChart3,
  Boxes,
  Calculator,
  CalendarDays,
  Circle,
  CreditCard,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  StickyNote,
  Trash2,
  User,
  UserPlus,
  Users,
};

export function AppIcon({ name, size = 16, strokeWidth = 1.9, ...props }) {
  const IconComponent = ICONS[name] || Circle;

  return <IconComponent size={size} strokeWidth={strokeWidth} {...props} />;
}
