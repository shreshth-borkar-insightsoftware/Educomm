import PageHeader from "@/components/PageHeader";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Educomm?",
      answer: "Educomm is an e-learning platform that combines digital courses with physical hardware kits. We offer courses in electronics, programming, robotics, and IoT, paired with kits that contain all the components you need to follow along and build real projects."
    },
    {
      question: "How do courses work?",
      answer: "Each course is made up of video modules and documentation. You watch the lessons, follow along step by step, and mark each module as complete when you're done. Your progress is tracked automatically so you can pick up where you left off."
    },
    {
      question: "What comes in a hardware kit?",
      answer: "Each kit is designed for a specific course and contains all the physical components you need — microcontrollers, sensors, wires, breadboards, and any other parts required for the course projects. Everything arrives in one package."
    },
    {
      question: "Do I need to buy a kit to take a course?",
      answer: "Kits are recommended for the full hands-on experience but not strictly required. You can browse course content independently. However, the real learning happens when you build along with the lessons."
    },
    {
      question: "How do I track my progress?",
      answer: "Each course has modules that you can mark as complete. Your overall progress is shown as a percentage on your dashboard. Once all modules are completed, the course is marked as finished."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We currently accept all major credit and debit cards through our secure Stripe payment gateway. All transactions are encrypted and secure."
    },
    {
      question: "How long does kit delivery take?",
      answer: "Delivery times vary depending on your location. Most orders within India are delivered within 5-7 business days. You can track your order status from the My Orders page."
    },
    {
      question: "Can I return a kit?",
      answer: "Yes, unopened kits can be returned within 14 days of delivery. Please contact our support team for return instructions. Opened kits cannot be returned due to the nature of electronic components."
    },
    {
      question: "Is there a refund policy for courses?",
      answer: "Since courses are digital content, we offer refunds only if you haven't completed more than 20% of the course modules. Please reach out to support for refund requests."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach us through the Contact page on our website. We aim to respond to all queries within 24-48 hours."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Header */}
        <PageHeader title="Frequently Asked Questions" subtitle="Everything you need to know about Educomm" />

        {/* FAQ Accordion */}
        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => {
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            const isOpen = openIndex === index;
            
            return (
              <div 
                key={index}
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden transition-all"
              >
                <button
                  id={buttonId}
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-white pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <Minus className="w-5 h-5 text-white" />
                    ) : (
                      <Plus className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>
                
                <div 
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0">
                    <div className="px-6 pb-6">
                      <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Still have questions?</h3>
          <p className="text-gray-400 mb-6">
            Our support team is here to help
          </p>
          <a 
            href="#" 
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
}
