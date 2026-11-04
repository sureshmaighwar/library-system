# Library

A library desk for members and librarians. Members browse the catalogue and borrow up to three items. Librarians add titles, watch loans, and clear overdue returns.

## Setup

1. Copy the environment file and set a real secret:

```bash
cp .env.example .env
```

`DATABASE_URL` points at local Postgres. `NEXTAUTH_SECRET` signs the session (Auth.js also accepts `AUTH_SECRET`). `NEXTAUTH_URL` is the app origin.

2. Start Postgres:

```bash
docker compose up -d
```

3. Install, migrate, and seed:

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Test logins

| Email | Password | Role |
| --- | --- | --- |
| librarian@lib.com | librarian123 | Librarian |
| member1@lib.com | member123 | Member |
| member2@lib.com | member123 | Member |

Passwords are stored as bcrypt hashes. The seed never prints the hash.

## Loan rules

- A loan is due 14 days after it is borrowed.
- A member can hold 3 active loans, and cannot borrow the same item twice while it is still out.
- The fine is $0.50 per overdue day, including a partial day. It is calculated from the due date and the return time, then saved as a decimal dollar amount. On-time returns are $0.00 and marked paid. A librarian marks a non-zero fine paid after the item is back.
- An active loan can be renewed once, which sets the due date 14 days out. Overdue loans cannot be renewed.
- When no copies are left, a member can join a reservation queue. Borrowing the item fulfills that reservation.

## Concurrency

Borrow and return run inside `prisma.$transaction`.

- Before counting a member's loans, the borrow locks that user row (`SELECT ... FOR UPDATE`), so two simultaneous borrows cannot slip past the 3-loan cap.
- Copies change with `updateMany` where `availableCopies > 0`. If no row matches, the transaction stops and stock stays at zero.
- One open loan per member and item is enforced by the partial unique index `loans_one_open_per_member_item` on `(userId, itemId)` where status is `ACTIVE` or `OVERDUE`. Returned loans are not part of that index, so the same book can be borrowed again.
- Return updates only a loan that is still `ACTIVE` or `OVERDUE`. A second return finds the loan already closed and does not increment `availableCopies` again. Each borrow and return also writes a stock log.

## Scripts

- `npm run dev` — Next.js
- `npm test` — Vitest unit tests for fines, borrow limits, and return idempotency
- `npm run db:seed` — seed the test accounts and books
