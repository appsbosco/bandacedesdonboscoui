import React from "react";
import PropTypes from "prop-types";
import Select from "react-select";

function CustomSelect({ labelId, value, onChange, options }) {
  const selectOptions = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const customStyles = {
    control: (base) => ({
      ...base,
      border: "1px solid #e2e8f0",
      borderRadius: "0.375rem",
      width: "100%",
      height: "calc(2.25rem + 2px)",
      color: "#000",
      boxShadow: "none",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    input: (base) => ({ ...base, borderColor: "#000", borderWidth: 0 }),
    placeholder: (base) => ({ ...base, fontSize: "0.8em" }),
    menu: (base) => ({ ...base, border: "none" }),
  };

  const handleChange = (selectedOption) => {
    onChange({
      target: {
        value: selectedOption ? selectedOption.value : "",
      },
    });
  };

  return (
    <Select
      id={labelId}
      value={selectOptions.find((option) => option.value === value)}
      onChange={handleChange}
      options={selectOptions}
      isSearchable
      styles={customStyles}
      classNamePrefix="react-select"
      className=" text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      placeholder="Seleccione una opción"
      noOptionsMessage={() => "No hay opciones"}
      menuPortalTarget={document.body}
    />
  );
}

CustomSelect.propTypes = {
  labelId: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default CustomSelect;
