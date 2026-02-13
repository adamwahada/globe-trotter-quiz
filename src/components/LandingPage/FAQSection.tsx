import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    q: "Can I play solo mode and practice on my own?",
    a: "Yes, absolutely. We offer a dedicated Solo Mode where you can roll the dice or manually select a country to test your knowledge. You can track your score and see if you improve compared to your previous attempts.",
  },
  {
    q: "How does the World Map Quiz work?",
    a: "You are given a country, and you must identify it correctly on the map. The faster and more accurate you are, the higher your score.",
  },
  {
    q: "Can I track my progress?",
    a: "Yes. Your scores are saved so you can monitor your improvement over time and challenge yourself to beat your previous results.",
  },
  {
    q: "Is the quiz suitable for beginners?",
    a: "Yes. The quiz is designed for all levels, from beginners learning world geography to advanced players looking to test their knowledge.",
  },
  {
    q: "Is the quiz free to play?",
    a: "Yes. You can start playing immediately without any cost.",
  },
  {
    q: "Do I need to create an account?",
    a: "You can play without an account, but creating one allows you to save your scores and track your progress.",
  },
];

export const FAQSection: React.FC = () => {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-14">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-0 rounded-lg bg-white/[0.04] backdrop-blur-sm overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-5 text-left text-base sm:text-lg font-semibold text-foreground hover:no-underline hover:bg-white/[0.03] transition-colors duration-200 [&[data-state=open]>svg]:rotate-45">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
