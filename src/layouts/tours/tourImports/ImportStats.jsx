/* eslint-disable react/prop-types */

export default function ImportStats({ stats }) {
  const cards = [
    {
      label: "Total",
      value: stats?.total ?? 0,
      color: "blue",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      label: "Válidas",
      value: stats?.valid ?? 0,
      color: "emerald",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      label: "Con errores",
      value: stats?.invalid ?? 0,
      color: "red",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      ),
    },
    {
      label: "Duplicadas",
      value: stats?.duplicates ?? 0,
      color: "amber",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", num: "text-blue-700" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", num: "text-emerald-700" },
    red: { bg: "bg-red-50", icon: "text-red-500", num: "text-red-700" },
    amber: { bg: "bg-amber-50", icon: "text-amber-500", num: "text-amber-700" },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const c = colorMap[card.color];
        return (
          <div key={card.label} className={`${c.bg} rounded-2xl p-4`}>
            <div className={`${c.icon} mb-2`}>{card.icon}</div>
            <p className={`text-2xl font-bold ${c.num}`}>{card.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
