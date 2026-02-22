import HelpPageLayout from "@/src/components/help/HelpPageLayout";
import InfoCard from "@/src/components/help/InfoCard";

export default function DevolucionesPage() {
  return (
    <HelpPageLayout
      title="Devoluciones"
      description="Las devoluciones deben ser acordadas entre comprador y vendedor, según la información publicada, el estado recibido y la evidencia disponible en el proceso de compra."
    >
      <section className="mt-8 space-y-6">
        <InfoCard title="Cuándo aplica una devolución">
          <p>
            Puede aplicar cuando el producto recibido no coincide con la
            descripción publicada, presenta daños no informados, o existe una
            diferencia sustancial frente a lo acordado antes de la compra.
          </p>
        </InfoCard>

        <InfoCard title="Proceso recomendado">
          <ol className="space-y-2 list-decimal pl-5">
            <li>Contactar al vendedor en el chat y describir el caso.</li>
            <li>Adjuntar fotos, videos o evidencia clara del problema.</li>
            <li>Definir solución: devolución total, parcial o reemplazo.</li>
            <li>Registrar en el chat los acuerdos de fechas y costos.</li>
          </ol>
        </InfoCard>

        <InfoCard title="Rol de RetroGarage">
          <p>
            RetroGarage no recibe ni redistribuye productos devueltos. Su rol es
            ofrecer el canal de comunicación y promover acuerdos justos entre
            comprador y vendedor. En situaciones complejas, el historial del
            chat funciona como respaldo para evaluar el caso.
          </p>
        </InfoCard>
      </section>
    </HelpPageLayout>
  );
}
