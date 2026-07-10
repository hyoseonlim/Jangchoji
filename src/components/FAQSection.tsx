import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
import type { Dictionary } from "@/i18n";

export function FAQSection({ dict }: { dict: Dictionary }) {
  const refund = dict.faq.refund;

  return (
    <section
      id="faq"
      className="py-24 px-5 md:px-8"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <h2
            className="text-black"
            style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {dict.faq.title}
          </h2>
          <div className="mt-4 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {dict.faq.items.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border border-black/10 px-6"
              style={{ borderRadius: "2px" }}
            >
              <AccordionTrigger
                className="text-left py-5 hover:no-underline hover:text-[#00C2D1] transition-colors"
                style={{ fontSize: "16px", fontWeight: 700, color: "#111" }}
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p
                  className="pb-5 text-black/70"
                  style={{ fontSize: "15px", lineHeight: 1.8 }}
                >
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div id="refund" className="mt-16 scroll-mt-20">
          <div className="mb-6">
            <h3
              className="text-black"
              style={{
                fontSize: "clamp(24px, 4.2vw, 32px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              {refund.title}
            </h3>
          </div>

          <div
            className="p-6 md:p-8 mb-4"
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
            }}
          >
            <p
              className="text-black font-bold mb-3"
              style={{ fontSize: "14px" }}
            >
              {refund.packageRulesTitle}
            </p>
            <ul
              className="space-y-2 text-black/75"
              style={{ fontSize: "14px", lineHeight: 1.7 }}
            >
              {refund.packageRules.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span style={{ color: "#e11d48", flexShrink: 0 }}>•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="p-6 md:p-8"
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
            }}
          >
            <p
              className="text-black font-bold mb-3"
              style={{ fontSize: "14px" }}
            >
              {refund.roomTitle}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #111" }}>
                    <th
                      className="text-left py-2.5 pr-4"
                      style={{ fontWeight: 700, color: "#111" }}
                    >
                      {refund.roomHead.when}
                    </th>
                    <th
                      className="text-right py-2.5 pl-4 whitespace-nowrap"
                      style={{ fontWeight: 700, color: "#111" }}
                    >
                      {refund.roomHead.fee}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {refund.roomSchedule.map((row, i) => (
                    <tr
                      key={row.when}
                      style={{
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        backgroundColor:
                          i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                      }}
                    >
                      <td className="py-2.5 pr-4" style={{ color: "#111" }}>
                        {row.when}
                      </td>
                      <td
                        className="py-2.5 pl-4 text-right whitespace-nowrap"
                        style={{
                          color: row.fee === refund.noRefundLabel ? "#e11d48" : "#111",
                          fontWeight: 700,
                        }}
                      >
                        {row.fee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          className="mt-12 p-6 border border-black/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderRadius: "2px", backgroundColor: "#f9f9f9" }}
        >
          <div>
            <p className="text-black font-bold" style={{ fontSize: "15px" }}>
              {dict.faq.contactTitle}
            </p>
            <p className="text-black/50 mt-1" style={{ fontSize: "13px" }}>
              {dict.faq.contactSubtitle}
            </p>
          </div>
          <a
            href={`tel:${dict.brand.phone}`}
            className="flex-shrink-0 inline-flex items-center px-5 py-2.5 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
            style={{ fontSize: "14px", borderRadius: "2px" }}
          >
            📞 {dict.brand.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
