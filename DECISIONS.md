# Architectural & Technical Decisions Log

This document records important non-obvious technical, architectural, security, and product decisions made during the development of BillGPT.

---

### Decision 1: Direct `bcrypt` Implementation over `passlib` Wrapper
* **Decision**: Implement password hashing and verification using the official `bcrypt` library directly (`bcrypt.hashpw` and `bcrypt.checkpw`) instead of `passlib.context.CryptContext`.
* **Context/Problem**: `passlib 1.7.4` relies on deprecated internal attributes of `bcrypt` (`bcrypt.__about__.__version__`) and executes a wrap-bug check with overlong secrets, which causes fatal runtime exceptions under modern `bcrypt 4.x/5.x`.
* **Why Chosen**: Direct `bcrypt` is lightweight, actively maintained, has zero compatibility overhead, and standardizes on secure salt generation (`bcrypt.gensalt()`) without unmaintained abstractions.
* **Alternatives Considered**: 
  - Downgrading `bcrypt` to `<4.0.0`: Rejected because older versions have known build/security constraints and dependency pinning fragility.
  - Monkey-patching `passlib`: Fragile and bad engineering practice.
* **Tradeoff/Consequence**: We write a 10-line clean wrapper in `auth.py` with type annotations instead of relying on `passlib` configuration dictionaries.

---

### Decision 2: Consistent Decimal Representation for Reward Rates
* **Decision**: Represent credit card reward rates exclusively as decimal floats where `0.04 = 4%`, `0.03 = 3%`, `0.02 = 2%`, `0.015 = 1.5%`.
* **Context/Problem**: Mixed representations (e.g. `1.5` for 1.5% vs `0.03` for 3%) introduce severe calculation errors in savings and net price formulas.
* **Why Chosen**: Standard decimal fractions align directly with mathematical multiplication (`price * (1 - reward_rate)`), eliminating runtime conversion bugs and ambiguities across database models, Pydantic schemas, and frontend display formatting.
* **Alternatives Considered**: Integer basis points (e.g. `400` for 4%): Accurate for multi-currency finance engines, but adds unnecessary complexity for a take-home project with floating-point dollar prices.
* **Tradeoff/Consequence**: Serializer and frontend layers format decimal values to percentage strings (e.g. `(rate * 100).toFixed(1) + '%'`) when displaying to users.

---

### Decision 3: Decoupling Card Rewards from Merchant Deals in Best-Way-to-Pay Engine
* **Decision**: Model credit cards as distinct payment options applied to the cheapest merchant deal, rather than creating separate deal rows for cards or conflating card cashback with merchant coupon codes.
* **Context/Problem**: Conflating card rewards with merchant deals causes double-counting discounts or false mutually exclusive choices (e.g., choosing either an Amazon sale price OR a card reward, when in reality a user pays for the Amazon deal WITH their rewards card).
* **Why Chosen**: Accurately reflects real-world consumer finance:
  1. Find the cheapest merchant deal among all competing sources (e.g. Best Buy at $1,099 vs MSRP $1,299).
  2. Separately apply each card's reward rate to that cheapest deal ($\text{Reward} = \text{cheapest\_price} \times \text{card\_rate}$).
  3. Compare resulting effective prices ($\text{Effective Price} = \text{cheapest\_price} \times (1 - \text{card\_rate})$).
  4. If a card offers a lower effective price than direct payment, recommend that card; otherwise fall back to direct payment at the cheapest price.
  5. Net savings vs MSRP: $\text{Total Savings} = \text{base\_price} - \text{effective\_price}$.
* **Alternatives Considered**: Storing pre-computed deal-card combinations in the database: Combinatorial explosion and high maintenance when card rates or deals change.
* **Tradeoff/Consequence**: Calculations run dynamically on search, which is instantaneous ($O(D \log D + C)$ for deals $D$ and cards $C$).

---

### Decision 4: Consolidated Core RESTful Route Schema (`/api/*`)
* **Decision**: Expose exclusively clean, predictable, single-responsibility routes under the `/api/*` namespace:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/deals/search?q=`
  - `POST /api/saved-comparisons`
  - `GET /api/saved-comparisons`
  - `DELETE /api/saved-comparisons/{id}`
* **Context/Problem**: Introducing duplicate route aliases (e.g. `/deals/search` and `/api/deals/search`) or redundant catalog CRUD endpoints causes API confusion, increased maintenance surface, and documentation fragmentation.
* **Why Chosen**: Standardizes frontend-backend contract, keeps the routing table minimal and robust, and guarantees predictable Swagger documentation.
* **Alternatives Considered**: Multiple router aliases and raw catalog CRUD endpoints: Avoided to keep the architecture clean and focused.

---

### Decision 5: Snapshot Storage for Saved Comparisons
* **Decision**: Store saved comparisons with a full JSON snapshot of the evaluated deals, chosen card, calculated effective price, and net savings at the time of save.
* **Context/Problem**: If merchant deal prices or card reward rates change or expire later, a relational-only reference would either break, show altered historical numbers, or cause foreign key deletion anomalies.
* **Why Chosen**: Users expect a "Saved Comparison" to represent exactly what they saw at the moment they saved it (an immutable point-in-time record of the deal calculation).
* **Alternatives Considered**: Storing only foreign key IDs (`user_id`, `product_id`, `deal_id`, `card_id`): Fragile to catalog updates and incapable of capturing the exact point-in-time calculation state.
* **Tradeoff/Consequence**: Uses a small amount of JSON storage per saved comparison, which SQLite handles natively and efficiently.

---

### Decision 6: Ownership Enforcement via Scoped Database Queries
* **Decision**: Enforce user isolation by filtering every comparison database query by `user_id == current_user.id` at the SQL query level, returning 404 if not found.
* **Context/Problem**: Insecure direct object reference (IDOR) vulnerabilities occur when applications fetch records by ID alone and check permissions afterward, or fail to filter queries.
* **Why Chosen**: Query scoping ensures a user cannot even infer the existence of another user's saved comparisons, preventing information leakage while enforcing strict data isolation at the ORM layer.
* **Alternatives Considered**: Fetch by ID then verify `comparison.user_id == current_user.id` returning 403: Leaks the existence of records owned by other users.
* **Tradeoff/Consequence**: Unified 404 response for both non-existent items and unauthorized items.

---

### Decision 7: Demo Credentials Isolated to Local Development
* **Decision**: Seed demo credentials (`test@example.com` / `password123`) strictly during local development seeding and isolate authentication in production.
* **Context/Problem**: Hardcoding test credentials into core authentication routines or allowing insecure defaults in production creates security risks.
* **Why Chosen**: `seed.py` seeds a demo user solely for local testing and interactive Swagger evaluation, while JWT secrets and auth logic enforce production-ready standards.

---

### Decision 8: JWT Storage in `localStorage` for Take-Home Simplicity
* **Decision**: Store the authenticated Bearer JWT token in browser `localStorage` under the `billgpt_token` key.
* **Context/Problem**: In enterprise web applications, storing JWTs in `localStorage` carries XSS risk compared to `HttpOnly` Secure SameSite cookies. However, `HttpOnly` cookies require cross-origin cookie domain sharing, CSRF token handling, and complex local development CORS configurations.
* **Why Chosen**: Standardizes token transport as an explicit `Authorization: Bearer <TOKEN>` HTTP header, making it simple to inspect in the browser Network tab, test with `curl` / Swagger UI, and persist across page refreshes for this 2-day take-home evaluation.
* **Alternatives Considered**: `HttpOnly` cookies: Better XSS mitigation in production, but adds cookie configuration overhead for a localized Vite + FastAPI dev server.
* **Tradeoff/Consequence**: In production, sensitive banking tokens should transition to short-lived in-memory tokens paired with `HttpOnly` refresh cookies.

