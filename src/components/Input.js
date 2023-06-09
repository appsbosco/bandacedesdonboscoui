import React from "react";
import PropTypes from "prop-types";

const Input = ({ value, onChange, label, placeholder, id, type }) => {
  return (
    <input
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      fullWidth
      type={type}
      id={id}
      className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "0.375rem",
        width: "100%",
        height: "calc(2.25rem + 2px)",
        color: "#000",
      }}
    />
  );
};

Input.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
};

export default Input;
