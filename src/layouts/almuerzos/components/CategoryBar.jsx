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
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xl font-bold text-gray-900">Categorías</h3>

          {/* opcional: indicador */}
          <span className="text-xs text-gray-500 hidden sm:inline">Deslizá horizontalmente</span>
        </div>

        {/* Wrapper horizontal ESTABLE en móviles */}
        <div
          className="
            flex gap-3
            overflow-x-auto overflow-y-hidden
            flex-nowrap whitespace-nowrap
            overscroll-x-contain
            snap-x snap-mandatory
            [scrollbar-width:none] [-ms-overflow-style:none]
            touch-pan-x
            py-1
          "
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* hide scrollbar (webkit) */}
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          <div className="flex gap-3 hide-scrollbar">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  aria-label={`Filtrar por ${category.name}`}
                  aria-pressed={isActive}
                  className={`
                    snap-start
                    flex flex-col items-center justify-center
                    min-w-[92px] sm:min-w-[110px]
                    px-4 py-3
                    rounded-xl border-2
                    transition-all duration-200
                    select-none
                    ${
                      isActive
                        ? "bg-black text-white border-black shadow-md scale-[1.02]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm"
                    }
                  `}
                >
                  <span className="text-2xl sm:text-3xl leading-none mb-2">{category.icon}</span>
                  <span className="text-sm font-semibold whitespace-nowrap leading-none">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

CategoryBar.displayName = "CategoryBar";

export default CategoryBar;

// ===========================
// CATEGORY IMAGES (Constants)
// ===========================
export const CATEGORY_IMAGES = {
  Almuerzo: "/assets/images/almuerzo/almuerzo.webp",
  Bebidas: "/assets/images/almuerzo/bebida.webp",
  Postres: "/assets/images/almuerzo/postre.webp",
};

CategoryBar.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
};
