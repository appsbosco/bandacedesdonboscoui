import React from "react";
import { useQuery } from "@apollo/client";
import { DOCUMENTS_EXPIRING_SUMMARY } from "../../graphql/documents.gql";
import { Skeleton } from "../ui/Skeleton";

export function ExpirationSummaryCards() {
  const { data, loading, error } = useQuery(DOCUMENTS_EXPIRING_SUMMARY, {
    variables: { referenceDate: new Date().toISOString() },
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <Skeleton variant="title" className="mb-2" />
            <Skeleton className="mb-1" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return null;

  const summary = data?.documentsExpiringSummary || {};

  const cards = [
    {
      label: "Total Documentos",
      value: summary.total || 0,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      icon: "📄",
    },
    {
      label: "Expirados",
      value: summary.expired || 0,
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: "⚠️",
    },
    {
      label: "Expiran en 30 días",
      value: summary.expiringIn30Days || 0,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      icon: "⏰",
    },
    {
      label: "Válidos",
      value: summary.valid || 0,
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: "✓",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-2xl ${card.bgColor} p-2 rounded-lg`}>{card.icon}</span>
            <span className={`text-3xl font-bold ${card.color}`}>{card.value}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
