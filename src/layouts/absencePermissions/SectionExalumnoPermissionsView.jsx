import React, { useState } from "react";
import { MemberPermissionsView } from "./MemberPermissionsView";
import { SectionPermissionsView } from "./SectionPermissionsView";

export function SectionExalumnoPermissionsView() {
  const [activeView, setActiveView] = useState("mine");

  return (
    <div>
      <div className="mx-auto flex max-w-3xl gap-1 px-4 pt-6">
        {[
          { value: "mine", label: "Mis permisos" },
          { value: "section", label: "Mi sección" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveView(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeView === option.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {activeView === "mine" ? <MemberPermissionsView /> : <SectionPermissionsView />}
    </div>
  );
}
