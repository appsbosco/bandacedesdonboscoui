import React from "react";
import PropTypes from "prop-types";

const Select = ({ id, name, value, onChange, options }) => {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "0.375rem",
        width: "100%",
        height: "calc(2.25rem + 2px)",
        color: "#000",
      }}
    >
      <option value="">Seleccione una opción</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

Select.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ).isRequired,
};

export default Select;
