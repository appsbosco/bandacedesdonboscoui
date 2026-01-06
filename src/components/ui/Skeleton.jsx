import React from "react";
import PropTypes from "prop-types";

export function Skeleton({ className = "", variant = "text" }) {
  const variants = {
    text: "h-4",
    title: "h-6",
    avatar: "h-12 w-12 rounded-full",
    thumbnail: "h-24 w-24 rounded-lg",
    card: "h-48 rounded-lg",
  };

  return <div className={`animate-pulse bg-gray-200 rounded ${variants[variant]} ${className}`} />;
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["text", "title", "avatar", "thumbnail", "card"]),
};

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};
