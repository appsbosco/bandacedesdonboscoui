import { forwardRef } from "react";
import PropTypes from "prop-types";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@mui/material/Icon";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { menuItem, menuImage } from "examples/Items/NotificationItem/styles";

const OrderItem = forwardRef(({ color, image, title, description, date, ...rest }, ref) => (
  <MenuItem {...rest} ref={ref} sx={(theme) => menuItem(theme)}>
    <SoftBox
      width="2.25rem"
      height="2.25rem"
      mt={0.25}
      mr={2}
      mb={0.25}
      borderRadius="lg"
      sx={(theme) => menuImage(theme, { color })}
    >
      {image}
    </SoftBox>
    <SoftBox>
      <SoftTypography variant="button" textTransform="capitalize" fontWeight="regular">
        {title} {/* Modificado para aceptar una cadena en lugar de un arreglo */}
      </SoftTypography>
      {description && (
        <SoftTypography
          variant="caption"
          color="secondary"
          sx={{
            display: "block",
            mt: 0.5,
            overflowWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          {description}
        </SoftTypography>
      )}
      <SoftTypography
        variant="caption"
        color="secondary"
        sx={{
          display: "flex",
          alignItems: "center",
          mt: 0.5,
        }}
      >
        {date && <Icon sx={{ lineHeight: 1.2, mr: 0.5 }}>watch_later</Icon>}
        {date}
      </SoftTypography>
    </SoftBox>
  </MenuItem>
));

OrderItem.defaultProps = {
  color: "dark",
  description: "", // Valor predeterminado para descripción
};

OrderItem.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  image: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired, // Actualizado para requerir una cadena
  description: PropTypes.string, // Nuevo prop para la descripción
  date: PropTypes.string.isRequired,
};

export default OrderItem;
