import StatsCard from "./StatsCards";

export default function StatsGrid() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Mis compras"
        value="12"
        subtitle="2 en camino"
        accent="amber"
      />

      <StatsCard
        title="Mis ventas"
        value="5"
        subtitle="1 por enviar"
        accent="emerald"
      />

      <StatsCard
        title="Total ventas"
        value="$48.300"
        subtitle="Últimos 30 días"
        accent="emerald"
      />

      <StatsCard
        title="Mi reputación"
        value="4.8 ★"
        subtitle="23 reseñas"
        accent="amber"
      />
    </section>
  );
}
