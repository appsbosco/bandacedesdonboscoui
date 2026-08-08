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

    const buttonSize = size === "small" ? "small" : "medium";

    return (
      <div className="inline-flex min-h-[40px] items-center overflow-hidden rounded-full bg-slate-100">
        <IconButton
          size={buttonSize}
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Disminuir cantidad"
          className="transition-colors hover:bg-slate-200"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>

        <span
          className="flex h-10 min-w-10 items-center justify-center bg-white px-2 text-sm font-extrabold text-slate-950"
          aria-live="polite"
          aria-label={`Cantidad: ${value}`}
        >
          {value}
        </span>

        <IconButton
          size={buttonSize}
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Aumentar cantidad"
          className="transition-colors hover:bg-slate-200"
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
