export function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }} className="animate-pulse">
      <div style={{ height: 140, background: "#e2e8f0" }} />
      <div
        className="max-w-7xl mx-auto px-4 py-8"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 90, background: "#e2e8f0", borderRadius: 16 }} />
          ))}
        </div>
        <div style={{ height: 48, background: "#e2e8f0", borderRadius: 14 }} />
        <div style={{ height: 180, background: "#e2e8f0", borderRadius: 20 }} />
      </div>
    </div>
  );
}
