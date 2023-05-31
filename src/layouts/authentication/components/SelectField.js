import { useField } from "formik";
import PropTypes from "prop-types";
import "./select.css";
import TextField from "@mui/material/TextField";

const SelectField = ({ label, options, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <TextField
      fullWidth
      select
      label={label}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      SelectProps={{
        native: true,
        style: { width: "100%" },
      }}
      {...props}
    >
      <option style={{ width: "100%" }} value="">
        Seleccione una opción
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </TextField>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SelectField;
