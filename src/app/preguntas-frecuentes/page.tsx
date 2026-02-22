import FaqAccordion from "@/src/components/help/FaqAccordion";
import HelpPageLayout from "@/src/components/help/HelpPageLayout";
import InfoCard from "@/src/components/help/InfoCard";
import { FAQ_ITEMS } from "@/src/content/help/faqs";

export default function PreguntasFrecuentesPage() {
  return (
    <HelpPageLayout
      title="Preguntas Frecuentes"
      description="Resolvemos las dudas más comunes sobre compras, ventas, envíos, devoluciones y soporte en RetroGarage."
    >
      <section className="mt-8 hidden md:grid gap-4">
        {FAQ_ITEMS.map((item) => (
          <InfoCard key={item.question} title={item.question} className="p-6">
            <p>{item.answer}</p>
          </InfoCard>
        ))}
      </section>

      <section className="mt-8 md:hidden">
        <FaqAccordion items={FAQ_ITEMS} />
      </section>
    </HelpPageLayout>
  );
}
