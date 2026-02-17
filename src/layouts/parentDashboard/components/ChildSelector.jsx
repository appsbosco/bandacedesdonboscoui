import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";

const ChildSelector = ({ childrenData, selectedChildId, onSelectChild }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedChild = selectedChildId
    ? childrenData.find((c) => c.child.id === selectedChildId)
    : null;

  const displayName = selectedChild
    ? `${selectedChild.child.name} ${selectedChild.child.firstSurName}`
    : "Todos los hijos";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (childrenData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          No hay hijos vinculados a esta cuenta. Contactá al administrador.
        </p>
      </div>
    );
  }

  if (childrenData.length === 1) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {childrenData[0].child.name[0]}
            {childrenData[0].child.firstSurName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">
              {childrenData[0].child.name} {childrenData[0].child.firstSurName}
            </p>
            <p className="text-sm text-gray-500">
              {childrenData[0].child.instrument || "Sin instrumento"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-label="Seleccionar hijo"
      >
        <div className="flex items-center gap-3">
          <div className=" rounded-full flex items-center justify-center text-white font-bold text-sm">
            {selectedChild ? (
              <>
                {selectedChild.child.name[0]}
                {selectedChild.child.firstSurName[0]}
              </>
            ) : (
              ""
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
              {selectedChild
                ? selectedChild.child.instrument || "Sin instrumento"
                : `${childrenData.length} hijo${childrenData.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => {
              onSelectChild(null);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${
              !selectedChildId ? "bg-blue-50" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
              👥
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Todos los hijos</p>
              <p className="text-xs text-gray-500">Ver resumen completo</p>
            </div>
          </button>

          {childrenData.map((childData) => (
            <button
              key={childData.child.id}
              onClick={() => {
                onSelectChild(childData.child.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                selectedChildId === childData.child.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {childData.child.name[0]}
                {childData.child.firstSurName[0]}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {childData.child.name} {childData.child.firstSurName}
                </p>
                <p className="text-xs text-gray-500">
                  {childData.child.instrument || "Sin instrumento"}
                </p>
              </div>
              {selectedChildId === childData.child.id && (
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

ChildSelector.propTypes = {
  childrenData: PropTypes.arrayOf(
    PropTypes.shape({
      child: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        firstSurName: PropTypes.string.isRequired,
        instrument: PropTypes.string,
      }).isRequired,
    })
  ).isRequired,
  selectedChildId: PropTypes.string,
  onSelectChild: PropTypes.func.isRequired,
};

export default ChildSelector;
