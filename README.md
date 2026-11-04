# Library System

A desk for a small library. Members find a book and take it home. Librarians watch the shelf, manage titles, and close loans.

**Author:** Suresh Kumar

## Features

| | Members | Librarians |
| --- | --- | --- |
| Catalogue | Search, category filters, item detail, borrow | Same shelves, plus stock tools |
| Loans | My Loans, live fine, one renewal | All, Active, Returned, and Overdue tabs |
| Desk | Reservation queue when a title is out | Dashboard, restock, return, mark fine paid |
| Feedback | Empty states and toasts | Same, plus Try again when a page fails |

Members filter the catalogue and open a cover-and-details page. My Loans splits books that are still out from returned history. A late book shows a live fine. One renewal is allowed before the due date.

Librarians land on a dashboard with their name, today's date, and four counts: total items, copies on loan, overdue loans, and low-stock titles. Restock adds one copy from the low-stock list. Recent activity lists the latest borrows and returns. Shortcuts open items, all loans, and overdue loans.

The items desk searches by title, author, or ISBN, filters by category, and shows 8 titles per page. Add and edit share one dialog. Restock asks for a quantity and a reason. Delete is refused while a title still has an open loan. When a delete is allowed, the stock log keeps the title and ISBN after the item row is gone, because `StockLog.itemId` is optional and clears on delete.

The loans desk searches by member or title. Returning an open loan asks for confirmation and shows the fine when the book is late. A returned loan with an unpaid fine can be marked paid. The overdue page counts late loans, totals their current fines, and shows the days overdue. Contact Member is a placeholder and does not send a message.

Toasts close after 3 seconds. Success is green, an error is red, and info is blue. Lists that are empty offer a next step.

## Setup

1. Copy the environment file and set a real secret:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `NEXTAUTH_SECRET` | Signs the session. Auth.js also accepts `AUTH_SECRET` |
| `NEXTAUTH_URL` | App origin, usually `http://localhost:3000` |

2. Use Postgres at `localhost:5432`, which matches `.env.example`.

3. Install, sync the schema, and seed:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

`npx prisma db push` applies the current schema, including the Auth.js account tables. Those tables are not in the older migration files. Open http://localhost:3000.

## Docker

`docker compose up --build` starts Postgres, applies the schema, seeds the test accounts, and serves the app at http://localhost:3000.

```bash
docker compose up --build
```

The database is published on host port `5433` so it does not take `5432`. Inside the Compose network the app uses `db:5432`. Starting Compose again runs the seed again, which resets the demo books and loans.

The production image only starts Next.js. Schema and seed stay with the Compose setup service.

```bash
docker build -t library-system .
docker run -p 3000:3000 --env-file .env library-system
```

Pushes to `main` publish `sainsuresh/library-system` when these GitHub Actions secrets are set:

| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token, not the account password |

Add them under the repository settings, Secrets and variables, Actions, on the **Secrets** tab.

## Test logins

| Email | Password | Role |
| --- | --- | --- |
| librarian@lib.com | librarian123 | Librarian |
| member1@lib.com | member123 | Member |
| member2@lib.com | member123 | Member |

Passwords are stored as bcrypt hashes. The seed does not print the hash.

## Access

Librarian pages and librarian APIs are checked on the server.

| Caller | Result |
| --- | --- |
| Signed-out API call | 401 |
| Member calling a librarian API | 403 |
| Member opening a librarian page | Redirect to the catalogue |
| Signed-out visitor opening a protected page | Redirect to login |

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

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts Next.js |
| `npm test` | Vitest: fines, concurrency, return, loan limits, role checks, stock, search, and validation |
| `npm run db:seed` | Loads the test accounts and books |
