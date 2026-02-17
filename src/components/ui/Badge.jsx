import React from "react";
import PropTypes from "prop-types";

const colors = {
  gray: "bg-gray-100 text-gray-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
  orange: "bg-orange-100 text-orange-800",
  sky: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
};

export function Badge({ children, color = "gray", className = "", ...props }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${colors[color]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(["gray", "red", "yellow", "green", "blue", "indigo", "orange", "sky", "amber"]),
  className: PropTypes.string,
};
