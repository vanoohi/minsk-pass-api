# MinskPass API 🚌

A REST API for virtual top-up of Minsk public transit cards. Users can register their physical transit card, check balance, and purchase trips or subscriptions online — without visiting a cashier.

The system acts as the **single source of truth**: both the user app and transport validators (turnstiles) use the same database.

## Features

- 🔐 **JWT Authentication** — access + refresh token rotation
- 💳 **Card Management** — register and manage transit cards by card number
- 🎫 **Pass Types** — buy trips or subscriptions for metro, ground transport, or all
- 🚫 **Business Rules** — blocks purchase if incompatible pass already exists
- 💰 **Stripe Payments** — real payment processing via Stripe (sandbox)
- 🚇 **Ride Validation** — validator endpoint simulating turnstile logic
- 📧 **Email Notifications** — confirmation emails on successful purchase
- 🐳 **Docker** — fully containerized with docker-compose

## Tech Stack

- **Node.js** + **TypeScript**
- **Express.js**
- **PostgreSQL** + **Prisma ORM**
- **Stripe** (payments)
- **Nodemailer** (email)
- **Zod** (validation)
- **Docker** + **docker-compose**

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cards` | Get all user cards |
| POST | `/api/v1/cards` | Add card by number |
| GET | `/api/v1/cards/:id` | Get card with pass info |
| PATCH | `/api/v1/cards/:id` | Update card alias |
| DELETE | `/api/v1/cards/:id` | Remove card |

### Pass (Проездной)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cards/:id/pass` | Get current pass status |
| GET | `/api/v1/cards/:id/pass/check?type=TRIPS&transport=METRO` | Check if purchase is allowed |

### Purchase
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/purchase` | Create payment intent |
| GET | `/api/v1/purchase/history` | Purchase history |
| POST | `/api/v1/purchase/webhook` | Stripe webhook |

### Validate (Turnstile)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/validate` | Validate ride (called by turnstile) |

## Pass Types

```
TRIPS       → Fixed number of rides
SUBSCRIPTION → Unlimited rides until expiry date

Transport:
  METRO  → Minsk Metro only
  GROUND → Bus, trolleybus, tram
  ALL    → All transport types
```

## Business Rules

- Card can only have **one active pass** at a time
- Cannot buy trips if subscription is active
- Cannot buy subscription if trips remain
- Expired subscription is automatically cleared

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/vanoohi/minsk-pass-api.git
cd minsk-pass-api
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in your values
```

### 3. Run with Docker

```bash
docker-compose up -d
npm run db:migrate
```

### 4. Or run locally

```bash
# Start PostgreSQL separately, then:
npm run db:migrate
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key (use `sk_test_` for sandbox) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |

## License

MIT
