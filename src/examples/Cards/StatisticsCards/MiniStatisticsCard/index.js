import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Box } from "@mui/material";

function MiniStatisticsCard({ bgColor, title, count, percentage, icon, direction }) {
  return (
    <Card>
      <SoftBox bgColor={bgColor} variant="gradient">
        <SoftBox p={2} display="flex" alignItems="center">
          {direction === "left" && (
            <Box
              bgColor={bgColor === "white" ? icon.color : "white"}
              color={bgColor === "white" ? "white" : "dark"}
              width="3rem"
              height="3rem"
              marginLeft="auto"
              borderRadius="md"
              display="flex"
              justifyContent="center"
              alignItems="center"
              shadow="md"
            >
              <SoftBox
                variant="gradient"
                bgColor={bgColor === "white" ? icon.color : "white"}
                color={bgColor === "white" ? "white" : "dark"}
                width="3rem"
                height="3rem"
                marginLeft="auto"
                borderRadius="md"
                display="flex"
                justifyContent="center"
                alignItems="center"
                shadow="md"
                icon={icon}
              >
                {icon.component}
              </SoftBox>
            </Box>
          )}
          <Grid item xs={8}>
            <SoftBox ml={direction === "left" ? 2 : 0} lineHeight={1}>
              <SoftTypography
                variant="button"
                color={bgColor === "white" ? "text" : "white"}
                opacity={bgColor === "white" ? 1 : 0.7}
                textTransform="capitalize"
                fontWeight={title.fontWeight}
              >
                {title.text}
              </SoftTypography>
              <SoftTypography
                variant="h5"
                fontWeight="bold"
                color={bgColor === "white" ? "dark" : "white"}
              >
                {count}{" "}
                <SoftTypography variant="button" color={percentage.color} fontWeight="bold">
                  {percentage.text}
                </SoftTypography>
              </SoftTypography>
            </SoftBox>
          </Grid>
          {direction === "right" && (
            <Box
              bgColor={bgColor === "white" ? icon.color : "white"}
              color={bgColor === "white" ? "white" : "dark"}
              width="3rem"
              height="3rem"
              marginLeft="auto"
              borderRadius="md"
              display="flex"
              justifyContent="center"
              alignItems="center"
              shadow="md"
            >
              <SoftBox
                variant="gradient"
                bgColor={bgColor === "white" ? icon.color : "white"}
                color={bgColor === "white" ? "white" : "dark"}
                width="3rem"
                height="3rem"
                marginLeft="auto"
                borderRadius="md"
                display="flex"
                justifyContent="center"
                alignItems="center"
                shadow="md"
                icon={icon}
              >
                {icon.component}
              </SoftBox>
            </Box>
          )}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

MiniStatisticsCard.defaultProps = {
  bgColor: "white",
  title: {
    fontWeight: "medium",
    text: "",
  },
  percentage: {
    color: "success",
    text: "",
  },
  direction: "right",
};

MiniStatisticsCard.propTypes = {
  bgColor: PropTypes.oneOf([
    "white",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
  ]),
  title: PropTypes.PropTypes.shape({
    fontWeight: PropTypes.oneOf(["light", "regular", "medium", "bold"]),
    text: PropTypes.string,
  }),
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "white",
    ]),
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  icon: PropTypes.shape({
    color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
    component: PropTypes.node.isRequired,
  }).isRequired,
  direction: PropTypes.oneOf(["right", "left"]),
};

export default MiniStatisticsCard;
