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

// Images
import kal from "assets/images/kal-visuals-square.jpg";
import marie from "assets/images/marie.jpg";
import ivana from "assets/images/ivana-square.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

const ProfilesListData = [
  {
    image: kal,
    name: "Sophie B.",
    description: "Hi! I need more information..",
    action: {
      type: "internal",
      route: "/pages/Profile/Profile-overview",
      color: "info",
      label: "reply",
    },
  },
  {
    image: marie,
    name: "Anne Marie",
    description: "Awesome work, can you..",
    action: {
      type: "internal",
      route: "/pages/Profile/Profile-overview",
      color: "info",
      label: "reply",
    },
  },
  {
    image: ivana,
    name: "Ivanna",
    description: "Nosotros files I can..",
    action: {
      type: "internal",
      route: "/pages/Profile/Profile-overview",
      color: "info",
      label: "reply",
    },
  },
  {
    image: team4,
    name: "Peterson",
    description: "Have a great afternoon..",
    action: {
      type: "internal",
      route: "/pages/Profile/Profile-overview",
      color: "info",
      label: "reply",
    },
  },
  {
    image: team3,
    name: "Nick Daniel",
    description: "Hi! I need more information..",
    action: {
      type: "internal",
      route: "/pages/Profile/Profile-overview",
      color: "info",
      label: "reply",
    },
  },
];

export default ProfilesListData;
