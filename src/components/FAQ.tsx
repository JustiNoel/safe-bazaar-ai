import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the product scanning work?",
    answer: "Simply paste a product URL from marketplaces like Jumia, Kilimall, or Facebook Marketplace. Our AI analyzes vendor history, pricing patterns, customer reviews, and product authenticity markers to generate a comprehensive safety score in under 10 seconds."
  },
  {
    question: "What does the safety score mean?",
    answer: "Our safety score ranges from 0-100. Scores 80-100 indicate low risk (safe to buy), 60-79 suggest moderate caution needed, 40-59 indicate high risk, and below 40 means we strongly advise against purchasing. The score considers factors like vendor reputation, price anomalies, review authenticity, and regional risk factors."
  },
  {
    question: "Is my payment information secure?",
    answer: "Absolutely! We use Stripe for card payments and integrate directly with M-Pesa for mobile money. We never store your payment details on our servers. All transactions are encrypted and processed through secure, PCI-compliant payment processors."
  },
  {
    question: "What's the difference between Free and Premium plans?",
    answer: "Free users get 5 scans per day with basic risk summaries. Premium users (KES 200/month) enjoy unlimited scans, detailed risk breakdowns, M-Pesa transaction safety checks, voice readouts, scan history, and priority support. Premium Sellers (KES 500/month) also get verification badges and analytics dashboards."
  },
  {
    question: "How accurate is the AI detection?",
    answer: "Our AI has been trained on thousands of Kenyan marketplace transactions and achieves over 92% accuracy in detecting potential scams. We continuously improve our models based on new fraud patterns and user feedback to keep you protected against evolving threats."
  },
  {
    question: "Can I scan products from any website?",
    answer: "Currently, we support major Kenyan marketplaces including Jumia, Kilimall, Facebook Marketplace, and Instagram shops. We're actively adding support for more platforms. For unsupported sites, you can manually enter product details for a basic risk assessment."
  },
  {
    question: "What M-Pesa safety features do you offer?",
    answer: "Premium users can verify M-Pesa transaction requests before sending money. We check the recipient's transaction history for fraud patterns, verify business registration numbers, and flag suspicious payment requests. This helps protect you from common M-Pesa scams."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel anytime through your account settings or the customer portal. Your premium features will remain active until the end of your billing period. There are no cancellation fees or hidden charges."
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers. Learn more about how Safe Bazaar AI
            protects Kenyan shoppers from online fraud.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 + 0.3 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a
              href="mailto:support@safebazaar.co.ke"
              className="text-primary hover:underline font-medium"
            >
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
