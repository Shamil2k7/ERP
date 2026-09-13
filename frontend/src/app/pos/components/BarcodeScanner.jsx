"use client";
import pos from "../pos.css";

export default function CategoryTabs({ categories, active, onSelect, dark }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {categories.map((cat) => {
        const isActive = cat.label === active;
        return (
          <button
            key={cat.label}
            onClick={() => onSelect(cat.label)}
            className={`shrink-0 rounded-2xl px-5 py-3 min-w-[110px] text-left transition-colors ${
              isActive
                ? "bg-neutral-900 text-white"
                : dark
                ? "bg-neutral-800 text-neutral-200"
                : "bg-white text-neutral-800"
            }`}
          >
            <div
              className={`text-sm ${
                isActive ? "text-neutral-300" : dark ? "text-neutral-400" : "text-neutral-400"
              }`}
            >
              {cat.label}
            </div>
            <div className="text-lg font-bold leading-tight">{cat.count.toLocaleString()}</div>
          </button>
        );
      })}
    </div>
  );
}
