import HelpPageLayout from "@/src/components/help/HelpPageLayout";
import InfoCard from "@/src/components/help/InfoCard";

export default function EnviosPage() {
  return (
    <HelpPageLayout
      title="Envíos"
      description="RetroGarage conecta compradores y vendedores, pero no opera como empresa logística. La gestión de envío de cada venta es responsabilidad exclusiva del vendedor."
    >
      <section className="mt-8 space-y-6">
        <InfoCard title="Cómo funciona el envío">
          <p>
            Una vez confirmada la compra, vendedor y comprador coordinan los
            detalles de despacho: tipo de mensajería, tiempos estimados,
            embalaje y seguimiento. Recomendamos que el vendedor comparta
            número de guía y evidencia de entrega para mantener trazabilidad.
          </p>
        </InfoCard>

        <InfoCard title="Alcance de RetroGarage">
          <p>
            RetroGarage actúa como intermediario digital para facilitar el
            encuentro entre oferta y demanda. No recolecta, transporta ni
            distribuye productos, y por lo tanto no controla de forma directa la
            operación logística.
          </p>
          <p className="mt-3">
            En caso de incidentes de envío, nuestro equipo puede orientar el
            proceso de comunicación entre las partes, pero la ejecución del
            despacho y su cumplimiento corresponde al vendedor.
          </p>
        </InfoCard>

        <InfoCard title="Buenas prácticas recomendadas">
          <ul className="space-y-2">
            <li>• Usar embalaje acorde al tipo y fragilidad del producto.</li>
            <li>• Acordar tiempos de despacho antes de cerrar la venta.</li>
            <li>• Compartir guía y constancia de envío en el chat.</li>
            <li>• Informar cualquier novedad o retraso de forma temprana.</li>
          </ul>
        </InfoCard>
      </section>
    </HelpPageLayout>
  );
}
