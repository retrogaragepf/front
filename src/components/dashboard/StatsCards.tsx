type StatsCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accent?: "amber" | "emerald" | "slate";
};

export default function StatsCard({
  title,
  value,
  subtitle,
  accent = "amber",
}: StatsCardProps) {
  const accentClasses = {
    amber: "bg-amber-100",
    emerald: "bg-emerald-100",
    slate: "bg-slate-100",
  };

  return (
    <div className="bg-white border-4 border-slate-900 p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.1)] flex flex-col justify-between">
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-slate-600">
          {title}
        </p>

        <p className="font-display text-3xl mt-2">
          {value}
        </p>
      </div>

      {subtitle && (
        <div className={`mt-4 px-3 py-1 text-sm font-sans inline-block ${accentClasses[accent]}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
