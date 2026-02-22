"use client";

import { useState } from "react";
import { FAQItem } from "@/src/content/help/faqs";

type FaqAccordionProps = {
  items: FAQItem[];
};

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <article
            key={item.question}
            className="rounded-xl border-2 border-amber-900 bg-amber-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.75)]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full px-4 py-4 text-left font-handwritten font-bold text-amber-900"
              aria-expanded={isOpen}
            >
              {item.question}
            </button>

            {isOpen && (
              <p className="px-4 pb-4 font-handwritten leading-relaxed text-zinc-800">
                {item.answer}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
