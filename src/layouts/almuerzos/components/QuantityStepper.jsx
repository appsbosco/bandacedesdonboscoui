// ===========================
// QUANTITY STEPPER COMPONENT
// ===========================

import React from "react";
import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PropTypes from "prop-types";

const QuantityStepper = React.memo(
  ({ value = 1, onChange, min = 1, max = 99, size = "medium", disabled = false }) => {
    const handleIncrement = () => {
      if (value < max) onChange(value + 1);
    };

    const handleDecrement = () => {
      if (value > min) onChange(value - 1);
    };

    const handleInputChange = (e) => {
      const newValue = parseInt(e.target.value) || min;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
    };

    const buttonSize = size === "small" ? "small" : "medium";

    return (
      <div className="inline-flex items-center bg-white border border-gray-300 rounded-full overflow-hidden">
        <IconButton
          size={buttonSize}
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Disminuir cantidad"
          className="hover:bg-gray-100 transition-colors"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>

        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          max={max}
          aria-label="Cantidad"
          className="w-12 text-center border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 bg-transparent"
          style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
        />

        <IconButton
          size={buttonSize}
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Aumentar cantidad"
          className="hover:bg-gray-100 transition-colors"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </div>
    );
  }
);

QuantityStepper.displayName = "QuantityStepper";

export default QuantityStepper;

QuantityStepper.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(["small", "medium"]),
  disabled: PropTypes.bool,
};

QuantityStepper.defaultProps = {
  value: 1,
  min: 1,
  max: 99,
  size: "medium",
  disabled: false,
};
