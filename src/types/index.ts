export type Role = "MEMBER" | "LIBRARIAN";

export type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

export type ItemSummary = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string | null;
  coverImage: string | null;
  totalCopies: number;
  availableCopies: number;
  lowStockThreshold: number;
};

export type LoanSummary = {
  id: string;
  status: LoanStatus;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  fineAmount: { toString(): string } | number | string;
  finePaid: boolean;
  renewed: boolean;
  item: {
    id: string;
    title: string;
    author: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
};
