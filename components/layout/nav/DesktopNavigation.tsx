import { NAV_ITEMS } from "@/lib/navigation/navigationConfig";
import { NavItem } from "./NavItem";

/**
 * Desktop/tablet nav row — hover-driven dropdowns, config-driven so no item
 * is ever hardcoded JSX. Deliberately no overflow-x here (unlike the old
 * flat link row): per the CSS overflow spec, `overflow-x: auto` forces the
 * other axis to compute as `auto` too, which would clip every dropdown
 * panel positioned below this row. With only 4 top-level items this fits
 * comfortably without needing to scroll.
 */
export function DesktopNavigation() {
  return (
    <ul className="flex h-full min-w-0 list-none items-stretch">
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.label} item={item} />
      ))}
    </ul>
  );
}
