import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

const LIBRARIAN_PASSWORD = "librarian123";
const MEMBER_PASSWORD = "member123";

const items = [
  { title: "The Night Circus", author: "Erin Morgenstern", category: "Fiction", isbn: "9780385534635", description: "A duel between two young magicians in a traveling circus.", totalCopies: 4 },
  { title: "Circe", author: "Madeline Miller", category: "Fiction", isbn: "9780316556347", description: "The story of the witch Circe.", totalCopies: 3 },
  { title: "Piranesi", author: "Susanna Clarke", category: "Fiction", isbn: "9781635575637", description: "A man documents the halls of a vast house.", totalCopies: 2 },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", category: "Fiction", isbn: "9780593318171", description: "An artificial friend watches the family she serves.", totalCopies: 5 },
  { title: "The Midnight Library", author: "Matt Haig", category: "Fiction", isbn: "9780525559474", description: "A library of lives that might have been.", totalCopies: 1 },
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", isbn: "9780553380163", description: "Space, time, and the universe for general readers.", totalCopies: 3 },
  { title: "The Gene", author: "Siddhartha Mukherjee", category: "Science", isbn: "9781476733524", description: "An intimate history of the gene.", totalCopies: 2 },
  { title: "Silent Spring", author: "Rachel Carson", category: "Science", isbn: "9780618249060", description: "The book that helped start the modern environmental movement.", totalCopies: 4 },
  { title: "Cosmos", author: "Carl Sagan", category: "Science", isbn: "9780345539434", description: "A tour of the universe and scientific discovery.", totalCopies: 2 },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "History", isbn: "9780062316097", description: "A brief history of humankind.", totalCopies: 3 },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", category: "History", isbn: "9780393317558", description: "Why societies developed differently across continents.", totalCopies: 2 },
  { title: "The Silk Roads", author: "Peter Frankopan", category: "History", isbn: "9781101912379", description: "A new history of the world from the east.", totalCopies: 4 },
  { title: "SPQR", author: "Mary Beard", category: "History", isbn: "9781631492228", description: "A history of ancient Rome.", totalCopies: 1 },
  { title: "Clean Code", author: "Robert C. Martin", category: "Tech", isbn: "9780132350884", description: "A handbook of agile software craftsmanship.", totalCopies: 3 },
  { title: "Design Patterns", author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", category: "Tech", isbn: "9780201633610", description: "Elements of reusable object-oriented software.", totalCopies: 2 },
  { title: "The Pragmatic Programmer", author: "David Thomas, Andrew Hunt", category: "Tech", isbn: "9780135957059", description: "A practical guide to software craftsmanship.", totalCopies: 4 },
] as const;

async function main() {
  const librarianHash = await bcrypt.hash(LIBRARIAN_PASSWORD, 10);
  const memberHash = await bcrypt.hash(MEMBER_PASSWORD, 10);

  const librarian = await prisma.user.upsert({
    where: { email: "librarian@lib.com" },
    update: { name: "Amina Shah", role: "LIBRARIAN", passwordHash: librarianHash },
    create: {
      name: "Amina Shah",
      email: "librarian@lib.com",
      role: "LIBRARIAN",
      passwordHash: librarianHash,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "member1@lib.com" },
    update: { name: "Julian Park", role: "MEMBER", passwordHash: memberHash },
    create: {
      name: "Julian Park",
      email: "member1@lib.com",
      role: "MEMBER",
      passwordHash: memberHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "member2@lib.com" },
    update: { name: "Nora Iqbal", role: "MEMBER", passwordHash: memberHash },
    create: {
      name: "Nora Iqbal",
      email: "member2@lib.com",
      role: "MEMBER",
      passwordHash: memberHash,
    },
  });

  await prisma.loan.deleteMany();

  const saved = [];
  for (const item of items) {
    const row = await prisma.item.upsert({
      where: { isbn: item.isbn },
      update: {
        title: item.title,
        author: item.author,
        category: item.category,
        description: item.description,
        totalCopies: item.totalCopies,
        availableCopies: item.totalCopies,
      },
      create: {
        ...item,
        availableCopies: item.totalCopies,
      },
    });
    saved.push(row);

    const logged = await prisma.stockLog.findFirst({
      where: { itemId: row.id, action: "ADDED_COPIES" },
    });
    if (!logged) {
      await prisma.stockLog.create({
        data: {
          itemId: row.id,
          changedBy: librarian.id,
          action: "ADDED_COPIES",
          quantity: item.totalCopies,
          reason: "Initial copies",
        },
      });
    }
  }

  const byIsbn = new Map(saved.map((item) => [item.isbn, item]));
  const loanPlan = [
    { isbn: "9780316556347", status: "ACTIVE" as const, daysAgo: 2 },
    { isbn: "9781635575637", status: "ACTIVE" as const, daysAgo: 5 },
    { isbn: "9780345539434", status: "ACTIVE" as const, daysAgo: 1 },
    { isbn: "9780525559474", status: "OVERDUE" as const, daysAgo: 20 },
  ];

  for (const plan of loanPlan) {
    const item = byIsbn.get(plan.isbn);
    if (!item) {
      throw new Error(`Missing seeded item ${plan.isbn}`);
    }

    const borrowedAt = new Date();
    borrowedAt.setDate(borrowedAt.getDate() - plan.daysAgo);
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.loan.create({
      data: {
        userId: member1.id,
        itemId: item.id,
        borrowedAt,
        dueDate,
        status: plan.status,
        fineAmount: "0.00",
        finePaid: true,
      },
    });

    await prisma.item.update({
      where: { id: item.id },
      data: { availableCopies: { decrement: 1 } },
    });
  }

  console.log("Seeded librarian@lib.com, member1@lib.com, and member2@lib.com.");
  console.log(`Seeded ${saved.length} items and ${loanPlan.length} loans.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
