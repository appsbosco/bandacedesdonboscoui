import TextField from "@mui/material/TextField";
import { useField } from "formik";
import PropTypes from "prop-types";

const InputField = ({ value, type, label, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <TextField
      fullWidth
      label={label}
      type={type}
      value={value}
      {...field}
      {...props}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      sx={{
        "& .MuiInputBase-root": {
          fontSize: "1.5rem", // Adjust the font size as desired
          padding: "1px", // Adjust the padding as desired
        },
      }}
    />
  );
};

InputField.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
};

export default InputField;
