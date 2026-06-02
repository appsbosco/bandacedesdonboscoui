/* eslint-disable react/prop-types */
import React from "react";
import { getPermissionTypeLabel } from "../permissionTypes";

const COLOR_BY_TYPE = {
  ABSENCE: "border-red-200 bg-red-50 text-red-700",
  LATE_ARRIVAL: "border-orange-200 bg-orange-50 text-orange-700",
  EARLY_WITHDRAWAL: "border-purple-200 bg-purple-50 text-purple-700",
};

export function PermissionTypeBadge({ type, size = "sm" }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border font-medium ${
        COLOR_BY_TYPE[type] ?? COLOR_BY_TYPE.ABSENCE
      } ${size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
    >
      {getPermissionTypeLabel(type)}
    </span>
  );
}

