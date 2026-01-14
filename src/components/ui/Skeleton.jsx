import React from "react";
import PropTypes from "prop-types";

export function Skeleton({ className = "", variant = "rect" }) {
  const variants = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={`
        skeleton bg-slate-800
        ${variants[variant]}
        ${className}
      `}
    />
  );
}

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["rect", "circle", "text"]),
};

export function DocumentCardSkeleton() {
  return (
    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function DocumentListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

DocumentListSkeleton.propTypes = {
  count: PropTypes.number,
};

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default Skeleton;
