import React from "react";
import PropTypes from "prop-types";
import { useField } from "formik";

const CustomSelect = ({ label, options, ...props }) => {
  const [field, meta] = useField(props);

  const handleCheckboxChange = (optionValue, isChecked) => {
    const selectedOptions = field.value || [];

    if (isChecked) {
      // Add the option to the selected options
      const updatedOptions = [...selectedOptions, optionValue];
      field.onChange({
        target: {
          name: field.name,
          value: updatedOptions,
        },
      });
    } else {
      // Remove the option from the selected options
      const updatedOptions = selectedOptions.filter((option) => option !== optionValue);
      field.onChange({
        target: {
          name: field.name,
          value: updatedOptions,
        },
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap">
        {options.map((option) => (
          <div key={option} className="flex items-center mr-4 mb-2">
            <input
              type="checkbox"
              id={`${field.name}-${option}`}
              name={field.name}
              value={option}
              checked={field.value && field.value.includes(option)}
              onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`${field.name}-${option}`} className="ml-2 block text-sm text-gray-700">
              {option}
            </label>
          </div>
        ))}
      </div>
      {meta.touched && meta.error && <div className="text-red-500 text-xs mt-1">{meta.error}</div>}
    </>
  );
};

CustomSelect.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CustomSelect;
