# RentIt

RentIt is an estate-first peer-to-peer rental marketplace. It lets residents list idle items, rent from nearby neighbors, simulate payment, complete a handover checklist, and grow a community trust score after safe returns.

## Current Beta Scope

- React + Vite frontend
- Node.js + Express backend
- MongoDB + Mongoose data layer
- Invite-code signup for closed estate access
- JWT authentication
- Seeded estate users and rental items
- Simulated identity verification
- Simulated checkout with 10% RentIt commission
- Handover checklist before rentals start
- Trust-level upgrade after successful returns
- Basic admin summary

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create the server environment file:

```bash
cp server/.env.example server/.env
```

3. Add a MongoDB URI and JWT secret inside `server/.env`.

4. Seed the database:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.
The backend runs at `http://localhost:5001`.

## Demo Accounts

All seeded users use this password:

```text
password123
```

- `admin@rentit.test`
- `chuks@rentit.test`
- `ayo@rentit.test`
- `nneka@rentit.test`

New users can signup with invite code:

```text
ESTATE-ALPHA
```

## Learning Path

We will treat this project as a software development classroom:

1. Read one feature before changing it.
2. Explain what the function or component does in plain English.
3. Make one small change.
4. Run the app or tests.
5. Commit the change.

### First Coding Tasks For You

- In `client/src/App.jsx`, find `handleAuth` and write down what each line does.
- In `server/src/lib/pricing.js`, change the commission rate from `0.1` to `0.12`, run the tests, then change it back.
- In `server/src/data/seedItems.js`, add one realistic estate item.
- In `client/src/styles.css`, change one color variable or button color and observe the UI.

## API Summary

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/users/me/verification`
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PATCH /api/items/:id`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `PATCH /api/bookings/:id/status`
- `GET /api/admin/summary`

## Deployment Notes

- Frontend can deploy to Vercel or Netlify.
- Backend can deploy to Render or Railway.
- Database should use MongoDB Atlas.
- Set `VITE_API_URL` on the frontend host to the deployed backend `/api` base URL.
- Set `CLIENT_URL` on the backend host to the deployed frontend URL.
