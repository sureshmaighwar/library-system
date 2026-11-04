# Library System

A library desk for members and librarians. Members search the catalogue and borrow books. Librarians add titles, adjust stock, return loans, and record fines.

Author: Suresh Kumar

## What you can do

Members sign in, filter the catalogue, open an item, and borrow it. My Loans splits books that are still out from returned history, shows a live fine when a book is late, and allows one renewal before the due date.

Librarians use the desk to see stock and overdue loans. Only a librarian can return a book. Returning saves the fine and puts one copy back.

## Setup

1. Copy the environment file and set a real secret:

```bash
cp .env.example .env
```

`DATABASE_URL` is the Postgres connection string. `NEXTAUTH_SECRET` signs the session. Auth.js also accepts `AUTH_SECRET`. `NEXTAUTH_URL` is the app origin, usually `http://localhost:3000`.

2. Start Postgres:

```bash
docker compose up -d
```

3. Install, sync the schema, and seed:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

`npx prisma db push` applies the current schema, including the Auth.js account tables. Open http://localhost:3000.

## Test logins

| Email | Password | Role |
| --- | --- | --- |
| librarian@lib.com | librarian123 | Librarian |
| member1@lib.com | member123 | Member |
| member2@lib.com | member123 | Member |

Passwords are stored as bcrypt hashes. The seed does not print the hash.

## Loan rules

- A loan is due 14 days after it is borrowed.
- Only a member can borrow. A member can hold 3 open loans, counting both active and overdue books, and cannot borrow the same item twice while it is still out.
- The fine is $0.50 per overdue day, including a partial day. It is calculated from the due date and the return time, then saved as a decimal dollar amount. The same dates always produce the same fine. On-time returns are $0.00 and marked paid.
- Unpaid fines of $10.00 or more block another borrow until a librarian marks them paid.
- An active loan can be renewed once, which sets the due date 14 days out. Overdue loans, and items someone else is waiting for, cannot be renewed.
- Only a librarian can return a loan. A second return responds that the loan was already returned and does not add another copy.
- When no copies are left, a member can join a reservation queue. Borrowing the item fulfills that member's reservation.

## Concurrency

Borrow and return run inside `prisma.$transaction`.

- Borrow locks the item row with `SELECT ... FOR UPDATE`. A second borrow of the same item waits. After the first commit, `availableCopies` is already lower, so two people cannot both take the last copy.
- The member row is locked the same way, so two borrows by one member cannot both pass the 3-loan cap.
- Copies decrease with `updateMany` where `availableCopies > 0`. If no row matches, the transaction stops and stock stays at zero.
- The schema unique key is `(userId, itemId, status)`. Open loans are checked as both `ACTIVE` and `OVERDUE`, so a late copy still blocks a second loan of that book.
- Return updates only a loan that is still `ACTIVE` or `OVERDUE`. A second return does not increment `availableCopies`. Each borrow and return also writes a stock log. A thrown error rolls the loan, the copy change, and the stock log back together.

## Scripts

- `npm run dev` starts Next.js.
- `npm test` runs the Vitest checks for fines, borrow limits, unpaid fines, and return.
- `npm run db:seed` loads the test accounts and books.
