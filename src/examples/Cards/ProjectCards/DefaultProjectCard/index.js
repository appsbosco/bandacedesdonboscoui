import { gql, useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import SoftAvatar from "components/SoftAvatar";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const GET_USERS_BY_ID = gql`
  query getUser {
    getUser {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      instrument
    }
  }
`;

function DefaultProjectCard({
  image,
  label,
  title,
  description,
  actions,
  authors,
  handleVerMasClick,
  handleEditarClick,
  handleRemoveClick,
}) {
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const userRole = userData?.getUser?.role;

  const renderAuthors = authors.map(({ image: media, name }) => (
    <Tooltip key={name} title={name} placement="bottom">
      <SoftAvatar
        src={media}
        alt={name}
        size="xs"
        sx={({ borders: { borderWidth }, palette: { white } }) => ({
          border: `${borderWidth[2]} solid ${white.main}`,
          cursor: "pointer",
          position: "relative",
          ml: -1.25,
          "&:hover, &:focus": {
            zIndex: "10",
          },
        })}
      />
    </Tooltip>
  ));

  const handleClick = (actionIndex) => {
    const action = actions[actionIndex];
    if (action.type === "internal") {
      if (actionIndex === 0) {
        handleVerMasClick();
      } else if (actionIndex === 1) {
        handleEditarClick();
      } else if (actionIndex === 2) {
        handleRemoveClick();
      }
    }
  };

  return (
    <div style={{ height: "100%" }}>
      <Card
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
          position: "relative",
        }}
        style={{ height: "100%" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "space-between",
            flexGrow: 1,
            overflow: "hidden",
          }}
        >
          <CardMedia
            src={image}
            component="img"
            title={title}
            sx={{
              maxWidth: "100%",
              margin: 0,
              boxShadow: ({ boxShadows: { md } }) => md,
              objectFit: "cover",
              objectPosition: "center",
              maxHeight: "100%",
            }}
          />

          <SoftBox pt={3} px={0.5} flexGrow={1} display="flex" flexDirection="column">
            <SoftBox mb={1}>
              <SoftTypography
                variant="button"
                fontWeight="regular"
                textTransform="capitalize"
                textGradient
              >
                {label}
              </SoftTypography>
            </SoftBox>
            <SoftBox mb={1}>
              {actions[0].type === "internal" ? (
                <SoftTypography
                  component={Link}
                  to={actions[0].route}
                  variant="h5"
                  textTransform="capitalize"
                >
                  {title}
                </SoftTypography>
              ) : (
                <SoftTypography
                  component="a"
                  href={actions[0].route}
                  target="_blank"
                  rel="noreferrer"
                  variant="h5"
                  textTransform="capitalize"
                >
                  {title}
                </SoftTypography>
              )}
            </SoftBox>
            <SoftBox mb={3} lineHeight={0}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                {description}
              </SoftTypography>
            </SoftBox>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mt="auto">
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {actions[0].type === "internal" ? (
                  <SoftButton
                    component={Link}
                    to={actions[0].route}
                    variant="outlined"
                    size="small"
                    color={actions[0].color}
                    onClick={() => handleClick(0)}
                  >
                    {actions[0].label}
                  </SoftButton>
                ) : (
                  <SoftButton
                    component="a"
                    href={actions[0].route}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    size="small"
                    color={actions[0].color}
                    onClick={() => handleClick(0)}
                  >
                    {actions[0].label}
                  </SoftButton>
                )}

                {userRole !== "Admin" &&
                userRole !== "Director" &&
                userRole !== "Subdirector" ? null : (
                  <>
                    {actions[1] && actions[1].type === "internal" ? (
                      <SoftButton
                        component={Link}
                        to={actions[1].route}
                        variant="outlined"
                        size="small"
                        color={actions[1].color}
                        onClick={() => handleClick(1)}
                      >
                        {actions[1].label}
                      </SoftButton>
                    ) : (
                      <SoftButton
                        component="a"
                        href={actions[1].route}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        size="small"
                        color={actions[1].color}
                        onClick={() => handleClick(1)}
                      >
                        {actions[1].label}
                      </SoftButton>
                    )}

                    {actions[2] && actions[2].type === "internal" ? (
                      <Tooltip title={actions[2].label} placement="top">
                        <Icon onClick={() => handleClick(2)}>{actions[2].icon}</Icon>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        title={actions[2].label}
                        placement="top"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <a href={actions[2]?.route || ""} target="_blank" rel="noreferrer">
                          <Icon>{actions[2]?.icon || ""}</Icon>
                        </a>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
              <SoftBox display="flex" alignItems="center">
                {renderAuthors}
              </SoftBox>
            </SoftBox>
          </SoftBox>
        </div>
      </Card>
    </div>
  );
}

// Setting default values for the props of DefaultProjectCard
DefaultProjectCard.defaultProps = {
  authors: [],
};

// Typechecking props for the DefaultProjectCard
DefaultProjectCard.propTypes = {
  image: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(["external", "internal"]),
      route: PropTypes.string.isRequired,
      color: PropTypes.oneOf([
        "primary",
        "secondary",
        "info",
        "success",
        "warning",
        "error",
        "light",
        "dark",
        "white",
      ]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
    })
  ).isRequired,
  authors: PropTypes.arrayOf(PropTypes.object),
  handleVerMasClick: PropTypes.func.isRequired,
  handleEditarClick: PropTypes.func.isRequired,
  handleRemoveClick: PropTypes.func.isRequired,
};

export default DefaultProjectCard;
