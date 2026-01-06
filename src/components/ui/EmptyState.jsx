import React from "react";
import { Button } from "./Button";
import PropTypes from "prop-types";

export function EmptyState({ icon = "📄", title, description, action, actionLabel, onAction }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Button onClick={onAction} variant="primary">
          {actionLabel || "Comenzar"}
        </Button>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};
