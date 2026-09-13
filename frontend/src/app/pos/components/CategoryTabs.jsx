"use client";

import {
  IconAll,
  IconElectronics,
  IconMobile,
  IconComputers,
  IconAccessories,
  IconHomeAppliances,
  IconClothing,
  IconFootwear,
  IconBeauty,
  IconToys,
  IconOthers,
} from "./icons";

const ICON_MAP = {
  All: IconAll,
  Electronics: IconElectronics,
  "Mobile Phones": IconMobile,
  Computers: IconComputers,
  Accessories: IconAccessories,
  "Home Appliances": IconHomeAppliances,
  Clothing: IconClothing,
  Footwear: IconFootwear,
  Beauty: IconBeauty,
  Toys: IconToys,
};

export default function CategoryTabs({ active, onSelect, categories = [] }) {
  const items = categories.map((cat) => {
    const name = typeof cat === "string" ? cat : cat.name;
    return {
      id: name,
      label: name,
      icon: ICON_MAP[name] || IconOthers,
    };
  });

  return (
    <aside className="pos-category-sidebar">
      {items.map((item) => {
        const IconComp = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`pos-sidebar-cat-btn ${isActive ? "active" : ""}`}
            title={item.label}
          >
            <IconComp className="pos-sidebar-cat-icon" />
            <span className="pos-sidebar-cat-label">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
