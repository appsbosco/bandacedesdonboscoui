import React from "react";
import PropTypes from "prop-types";

const artworkPaths = {
  hummingbird: "/images/icons/icon-1-01.svg",
  leaves: "/images/icons/icon-1-02.svg",
  foliage: "/images/icons/icon-1-03.svg",
  sloth: "/images/icons/icon-1-04.svg",
  turtle: "/images/icons/icon-1-05.svg",
  jaguar: "/images/icons/icon-1-06.svg",
  volcano: "/images/icons/icon-1-07.svg",
};

const BrandArtwork = ({ artwork, className = "", motion = "subtle" }) => {
  const motionClass = motion === "none" ? "" : `brand-scroll-art brand-scroll-art--${motion}`;

  return (
    <img
      src={artworkPaths[artwork]}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none ${motionClass} ${className}`}
    />
  );
};

BrandArtwork.propTypes = {
  artwork: PropTypes.oneOf(Object.keys(artworkPaths)).isRequired,
  className: PropTypes.string,
  motion: PropTypes.oneOf(["none", "subtle", "reverse", "far"]),
};

export default BrandArtwork;
