import React from "react";
import PropTypes from "prop-types";
import { useField } from "formik";

const SelectField = ({ label, options, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <>
      <select
        {...field}
        {...props}
        className={`border ${
          meta.touched && meta.error ? "border-red-500" : "border-gray-300"
        } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "0.375rem",
          width: "100%",
          height: "calc(2.25rem + 2px)",
          color: "#000",
        }}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
    </>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SelectField;
