// ===========================
// CATEGORY BAR COMPONENT (Mobile stable)
// ===========================
import PropTypes from "prop-types";
import React from "react";

const CATEGORIES = [
  { id: "", name: "Todos", icon: "🍽️" },
  { id: "Almuerzo", name: "Almuerzo", icon: "🍱" },
  { id: "Bebidas", name: "Bebidas", icon: "🥤" },
  { id: "Postres", name: "Postres", icon: "🍰" },
];

const CategoryBar = React.memo(({ selectedCategory, onCategoryChange }) => {
  return (
    <nav aria-label="Categorías de productos" className="border-b border-slate-100 bg-white">
      <div
        className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-4 pt-1 [scrollbar-width:none] sm:gap-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              aria-label={`Filtrar por ${category.name}`}
              aria-pressed={isActive}
              className="flex min-w-[76px] snap-start flex-col items-center gap-2 px-2 py-1.5 text-center sm:min-w-[88px]"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center text-4xl transition-transform sm:h-16 sm:w-16 sm:text-5xl ${
                  isActive ? "scale-110" : "opacity-85 hover:scale-105 hover:opacity-100"
                }`}
                aria-hidden="true"
              >
                {category.icon}
              </span>
              <span
                className={`border-b-2 pb-1 text-xs font-bold sm:text-sm ${
                  isActive
                    ? "border-slate-950 text-slate-950"
                    : "border-transparent text-slate-600"
                }`}
              >
                {category.name}
              </span>
            </button>
          );
        })}
        </div>
    </nav>
  );
});

CategoryBar.displayName = "CategoryBar";

export default CategoryBar;

CategoryBar.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
};
