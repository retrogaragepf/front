import HelpPageLayout from "@/src/components/help/HelpPageLayout";
import InfoCard from "@/src/components/help/InfoCard";

export default function GuiaDeEstadoPage() {
  return (
    <HelpPageLayout
      title="Guía de Estado"
      description="Esta guía ayuda a describir productos vintage, retro y de segunda mano con mayor claridad para que comprador y vendedor compartan expectativas realistas."
    >
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <InfoCard title="Como nuevo" className="p-6">
          <p>
            Sin señales visibles de uso, funcionamiento óptimo y presentación
            cuidada. Puede incluir empaque original o accesorios completos.
          </p>
        </InfoCard>

        <InfoCard title="Muy buen estado" className="p-6">
          <p>
            Uso leve, detalles menores estéticos y desempeño correcto. No
            afecta la funcionalidad ni el valor principal del artículo.
          </p>
        </InfoCard>

        <InfoCard title="Buen estado" className="p-6">
          <p>
            Marcas de uso visibles y desgaste esperable por antigüedad. El
            producto sigue siendo funcional o utilizable según su categoría.
          </p>
        </InfoCard>

        <InfoCard title="Estado restaurado" className="p-6">
          <p>
            Pieza intervenida o reacondicionada para mejorar su conservación,
            estética o funcionamiento. Se recomienda detallar qué se restauró.
          </p>
        </InfoCard>

        <InfoCard title="Para publicar con transparencia" className="sm:col-span-2">
          <ul className="space-y-2">
            <li>• Incluye fotos reales con luz natural y primeros planos.</li>
            <li>• Describe golpes, rayones, faltantes o reparaciones previas.</li>
            <li>• Indica funcionamiento actual y pruebas realizadas.</li>
            <li>• Especifica medidas, materiales y año aproximado si aplica.</li>
          </ul>
        </InfoCard>
      </section>
    </HelpPageLayout>
  );
}
