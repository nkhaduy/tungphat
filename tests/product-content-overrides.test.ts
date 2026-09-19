import { describe, expect, it } from "vitest";
import { getProductContent, getServiceContent } from "@/lib/product-content-overrides";

describe("product content overrides", () => {
  it("replaces repeated CMS ordering steps and FAQ answers on money pages", () => {
    for (const slug of ["van-mdf", "mdf-chong-am", "go-ghep", "go-ghep-cao-su"]) {
      const content = getProductContent(slug, {
        orderingSteps: ["Gửi thông tin.", "Gửi thông tin.", "Gửi thông tin."],
        faq: [
          { question: "Câu hỏi thứ nhất đủ dài", answer: "Câu trả lời dùng chung đủ dài để vượt qua kiểm tra." },
          { question: "Câu hỏi thứ hai đủ dài", answer: "Câu trả lời dùng chung đủ dài để vượt qua kiểm tra." },
        ],
      });

      expect(new Set(content.orderingSteps).size).toBe(content.orderingSteps.length);
      expect(new Set(content.faq.map((item) => item.answer)).size).toBe(content.faq.length);
    }
  });

  it("keeps unrelated slugs unchanged", () => {
    const fallback = {
      orderingSteps: ["Bước một", "Bước hai"],
      faq: [{ question: "Câu hỏi đủ dài để kiểm tra", answer: "Câu trả lời đủ dài để kiểm tra dữ liệu." }],
    };

    expect(getProductContent("mot-san-pham-khac", fallback)).toEqual(fallback);
  });

  it("keeps distinct CMS content when a page has already been corrected", () => {
    const fallback = {
      orderingSteps: ["Bước một rõ ràng", "Bước hai rõ ràng", "Bước ba rõ ràng"],
      faq: [
        { question: "Câu hỏi MDF thứ nhất đủ dài", answer: "Câu trả lời MDF thứ nhất đủ dài và riêng biệt." },
        { question: "Câu hỏi MDF thứ hai đủ dài", answer: "Câu trả lời MDF thứ hai đủ dài và riêng biệt." },
      ],
    };

    expect(getProductContent("van-mdf", fallback)).toEqual(fallback);
  });

  it("replaces repeated service FAQ answers while preserving corrected service content", () => {
    const repeated = {
      faq: [
        { question: "Câu hỏi CNC thứ nhất đủ dài", answer: "Câu trả lời CNC dùng chung đủ dài để kiểm tra." },
        { question: "Câu hỏi CNC thứ hai đủ dài", answer: "Câu trả lời CNC dùng chung đủ dài để kiểm tra." },
      ],
    };
    const corrected = {
      faq: [
        { question: "Câu hỏi CNC thứ nhất đủ dài", answer: "Câu trả lời CNC thứ nhất đủ dài và riêng biệt." },
        { question: "Câu hỏi CNC thứ hai đủ dài", answer: "Câu trả lời CNC thứ hai đủ dài và riêng biệt." },
      ],
    };

    const content = getServiceContent("cat-cnc-go", repeated);
    expect(new Set(content.faq.map((item) => item.answer)).size).toBe(content.faq.length);
    expect(getServiceContent("gia-cong-cnc-mdf", corrected)).toEqual(corrected);
  });
});
