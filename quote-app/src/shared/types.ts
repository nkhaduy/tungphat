export type UserRole = "ADMIN" | "EMPLOYEE";
export type QuoteStatus = "DRAFT" | "ISSUED" | "DEPOSITED" | "PAID" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "DEPOSITED" | "PARTIAL" | "PAID";

export type QuoteItemInput = {
  id?: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  note: string;
};

export type QuoteMoneyInput = {
  discount: number;
  shippingFee: number;
  processingFee: number;
  vatAmount: number;
  depositAmount: number;
};

export type QuoteTotals = QuoteMoneyInput & {
  subtotal: number;
  grandTotal: number;
  remainingAmount: number;
};

export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  role: UserRole;
  branchId: string | null;
  branchCode: string | null;
  branchName: string | null;
  mustChangePassword: boolean;
};

export type QuoteRecord = {
  id: string;
  quoteNumber: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  createdBy: string;
  employeeName: string;
  employeePhone: string;
  quoteDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryNote: string;
  generalNote: string;
  status: QuoteStatus;
  paymentStatus: PaymentStatus;
  totals: QuoteTotals;
  items: Array<QuoteItemInput & { id: string; position: number; lineTotal: number }>;
  latestPdfKey: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CompanySettings = {
  name: string;
  address: string;
  phone: string;
  headerContactName: string;
  headerPhone: string;
  website: string;
  logoPath: string;
  logoKey?: string | null;
};

export type BankSettings = {
  accountNumber: string;
  bankCode: string;
  holder: string;
  store: string;
};

export type DefaultSettings = {
  generalNote: string;
  deliveryNote: string;
};

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  address: string;
  updatedAt: string;
};

export type AppSettings = {
  company: CompanySettings;
  bank: BankSettings;
  defaults: DefaultSettings;
};
