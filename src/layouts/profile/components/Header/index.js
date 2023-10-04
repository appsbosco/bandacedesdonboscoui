/**
=========================================================
* Banda CEDES Don Bosco - v4.0.0
=========================================================

* Product Page: 
* Copyright 2023 Banda CEDES Don Bosco()

Coded by Josué Chinchilla

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";

// @mui material components
import AppBar from "@mui/material/AppBar";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

// Banda CEDES Don Bosco components
import SoftAvatar from "components/SoftAvatar";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Banda CEDES Don Bosco examples
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Banda CEDES Don Bosco icons
import Cube from "examples/Icons/Cube";
import Document from "examples/Icons/Document";
import Settings from "examples/Icons/Settings";

// Banda CEDES Don Bosco base styles
import breakpoints from "assets/theme/base/breakpoints";

// Images
import { gql, useQuery } from "@apollo/client";
import curved0 from "assets/images/curved-images/curved0.webp";
import ProfileImageUploader from "../ProfilePicture/ProfileImageUploader";
import { Avatar } from "@mui/material";
import { GET_USERS_BY_ID } from "graphql/queries";
import { GET_PARENTS_BY_ID } from "graphql/queries";

const Header = () => {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");
  const [tabValue, setTabValue] = useState(0);

  const { data, loading, error, refetch } = useQuery(GET_USERS_BY_ID);
  const { data: parentsData } = useQuery(GET_PARENTS_BY_ID);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [loading, refetch]);

  const { name, firstSurName, avatar, instrument } = data?.getUser || {};
  const {
    name: parentName,
    firstSurName: parenFirstSurName,
    secondSurName: parenSecondSurName,
  } = parentsData?.getParent || {};

  const userRole = data?.getUser?.role;
  const parentRole = parentsData?.getParent?.role;

  // Function to get the display name and role dynamically
  const getDisplayNameAndRole = () => {
    if (userRole) {
      return { displayName: name + " " + firstSurName, role: userRole };
    } else if (parentRole) {
      return { displayName: parentName + " " + parenFirstSurName };
    } else {
      return { displayName: "", role: "" };
    }
  };

  const { displayName, role } = getDisplayNameAndRole();

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    /** 
     The event listener that's calling the handleTabsOrientation function when resizing the window.
    */
    window.addEventListener("resize", handleTabsOrientation);

    // Call the handleTabsOrientation function to set the state with the initial value.
    handleTabsOrientation();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  const handleSetTabValue = (event, newValue) => setTabValue(newValue);

  const renderAvatar = () => {
    if (parentRole) {
      return (
        <SoftAvatar
          size="large"
          name={parentName + " " + parenFirstSurName}
          src={avatar}
          alt="Avatar"
        />
      );
    } else {
      return (
        <>
          {!avatar || avatar === "" ? (
            <ProfileImageUploader />
          ) : (
            <img
              className="w-20 h-20 rounded"
              style={{ objectFit: "cover", objectPosition: "center" }}
              src={avatar}
              alt="Avatar"
            />
          )}
        </>
      );
    }
  };

  return (
    <SoftBox position="relative">
      <DashboardNavbar absolute light />
      <SoftBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${curved0})`,
          backgroundSize: "cover",
          backgroundPosition: "100%",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          backdropFilter: `saturate(200%) blur(30px)`,
          backgroundColor: ({ functions: { rgba }, palette: { white } }) => rgba(white.main, 0.8),
          boxShadow: ({ boxShadows: { navbarBoxShadow } }) => navbarBoxShadow,
          position: "relative",
          mt: -8,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>{renderAvatar()}</Grid>
          <Grid item>
            <SoftBox height="100%" mt={0.5} lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                {displayName}
              </SoftTypography>
              <SoftTypography variant="button" color="text" fontWeight="medium">
                {instrument}
              </SoftTypography>
            </SoftBox>
          </Grid>
        </Grid>
      </Card>
    </SoftBox>
  );
};

export default Header;
