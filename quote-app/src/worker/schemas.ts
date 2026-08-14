import { z } from "zod";
import { quantityToMilli } from "../shared/calculations";
import { officialBranch } from "../shared/branches";

const vnd = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const text = (max: number) => z.string().trim().max(max);
const quantity = z.number().superRefine((value, context) => {
  try {
    quantityToMilli(value);
  } catch (error) {
    context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Số lượng không hợp lệ." });
  }
});

export const quoteItemSchema = z.object({
  id: z.string().uuid().optional(),
  productName: text(300),
  specification: text(300),
  quantity,
  unit: text(50),
  unitPrice: vnd,
  note: text(500),
});

export const quoteInputSchema = z.object({
  version: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
  branchId: z.string().min(1).max(100).optional(),
  quoteDate: z.iso.date(),
  customerName: text(200),
  customerPhone: text(30),
  customerAddress: text(500),
  deliveryNote: text(2000),
  generalNote: text(4000),
  discount: vnd,
  shippingFee: vnd,
  processingFee: vnd,
  vatAmount: vnd,
  vatRate: z.union([z.literal(0), z.literal(8), z.literal(10)]).nullable().optional(),
  depositAmount: vnd,
  paymentStatus: z.enum(["UNPAID", "DEPOSITED", "PARTIAL", "PAID"]).optional(),
  items: z.array(quoteItemSchema).max(500),
}).superRefine((value, context) => {
  if (value.items.every((item) => !item.productName && item.quantity === 0 && item.unitPrice === 0)) {
    context.addIssue({ code: "custom", path: ["items"], message: "Báo giá cần ít nhất một dòng sản phẩm." });
  }
});

export const paymentUpdateSchema = z.object({
  paymentStatus: z.enum(["UNPAID", "DEPOSITED", "PARTIAL", "PAID"]),
  receivedAmount: vnd,
  version: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});

export const userInputSchema = z.object({
  username: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()),
  fullName: z.string().trim().min(2).max(150),
  phone: z.string().trim().max(30),
  password: z.string().min(10).max(1024).optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  branchId: z.string().min(1).max(100).nullable(),
  isActive: z.boolean(),
});

export const branchInputSchema = z.object({
  code: z.string().trim().toUpperCase().refine((value) => Boolean(officialBranch(value)), "Chỉ hỗ trợ chi nhánh TP14 hoặc TP81."),
  name: z.string().trim().min(2).max(150),
  address: z.string().trim().max(500),
  phone: z.string().trim().max(30),
  isActive: z.boolean(),
});

export const settingsInputSchema = z.object({
  company: z.object({
    name: z.string().trim().min(2).max(300),
    address: z.string().trim().min(2).max(500),
    phone: z.string().trim().min(2).max(50),
    headerContactName: z.string().trim().min(2).max(80),
    headerPhone: z.string().trim().min(2).max(50),
    website: z.string().trim().min(2).max(150),
    logoPath: z.string().trim().max(300).regex(/^\/[A-Za-z0-9/_\-.]+$/).refine((value) => !value.includes(".."), "Đường dẫn logo không hợp lệ."),
  }),
  bank: z.object({
    accountNumber: z.string().trim().min(1).max(50),
    bankCode: z.string().trim().min(2).max(20),
    holder: z.string().trim().min(2).max(300),
    store: z.string().trim().min(1).max(100),
  }),
  defaults: z.object({
    generalNote: z.string().trim().max(4000),
    deliveryNote: z.string().trim().max(2000),
  }),
});
