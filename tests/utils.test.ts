import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, calculateOrderTotal } from "@/lib/utils";

describe("utils", () => {
  it("calcula total da OS", () => {
    expect(calculateOrderTotal(100, 50, 10)).toBe(140);
  });

  it("gera link de WhatsApp", () => {
    const link = buildWhatsAppLink("(11) 99999-0000", "Teste");
    expect(link).toContain("wa.me/11999990000");
  });
});
