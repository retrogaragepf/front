export type FAQItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "¿Cómo compro un producto en RetroGarage?",
    answer:
      "Busca el artículo, revisa su descripción y estado, y completa la compra desde la publicación. Recomendamos resolver dudas con el vendedor antes de confirmar.",
  },
  {
    question: "¿RetroGarage vende productos directamente?",
    answer:
      "No. RetroGarage funciona como marketplace entre usuarios. El producto siempre es publicado y gestionado por un vendedor registrado.",
  },
  {
    question: "¿Quién se encarga del envío?",
    answer:
      "El envío es responsabilidad del vendedor. Debe coordinar logística, tiempos y número de guía con el comprador.",
  },
  {
    question: "¿Puedo devolver un producto?",
    answer:
      "Sí, cuando exista una diferencia relevante entre lo recibido y lo publicado. La devolución se gestiona entre comprador y vendedor con evidencia en el chat.",
  },
  {
    question: "¿Cómo sé si un vendedor es confiable?",
    answer:
      "Evalúa claridad de la publicación, calidad de fotos, historial de comunicación y consistencia en la información compartida.",
  },
  {
    question: "¿Puedo editar o cancelar una publicación?",
    answer:
      "Sí. El vendedor puede actualizar su publicación si no afecta una compra ya confirmada. Si hay una operación en curso, debe coordinar primero con el comprador.",
  },
  {
    question: "¿Qué pasa si el producto llega dañado?",
    answer:
      "Debes reportarlo al vendedor de inmediato por chat y adjuntar evidencia. Con base en eso se define devolución, reposición o acuerdo parcial.",
  },
  {
    question: "¿Qué métodos de pago se aceptan?",
    answer:
      "Los métodos disponibles dependen de la integración activa en la plataforma al momento de la compra y se muestran durante el checkout.",
  },
  {
    question: "¿Cómo contacto al vendedor?",
    answer:
      "Desde la publicación del producto puedes abrir el chat para resolver dudas sobre estado, envío, disponibilidad y condiciones.",
  },
  {
    question: "¿Cómo contacto a administración?",
    answer:
      "Para escribir a administración debes estar registrado e iniciar sesión. Con tu cuenta activa podrás abrir el chat de Ayuda en la barra de navegación.",
  },
];
