import React from "react";
import PropTypes from "prop-types";

const TextArea = ({ id, name, value, onChange, rows, placeholder }) => {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      aria-describedby="message-description"
      placeholder={placeholder}
      className="block w-full px-4 py-4 leading-6 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
    />
  );
};

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
};

export default TextArea;
