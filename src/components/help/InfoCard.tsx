import { ReactNode } from "react";

type InfoCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function InfoCard({ title, children, className = "" }: InfoCardProps) {
  return (
    <article
      className={`rounded-2xl border-2 border-amber-900 bg-amber-100 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] ${className}`.trim()}
    >
      <h3 className="font-handwritten text-2xl font-bold text-amber-900">
        {title}
      </h3>
      <div className="font-handwritten mt-3 leading-relaxed text-zinc-800">
        {children}
      </div>
    </article>
  );
}
