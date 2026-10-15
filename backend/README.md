# Aisle Backend - Agentic AI Checkout

A Python backend using FastAPI and Microsoft AutoGen for the Aisle AI-powered shopping assistant.

## Architecture

### Agents (AutoGen)

The system uses multiple specialized agents that work together:

1. **Orchestrator Agent** - Coordinates the entire shopping workflow
2. **Shopping Agent** - Searches for products across multiple merchants
3. **Comparison Agent** - Compares prices across stores
4. **Rules Agent** - Enforces spending rules and guardrails
5. **Checkout Agent** - Handles secure checkout with virtual cards

### Flow

```
User Task → Orchestrator → Shopping Agent → Comparison Agent → Rules Agent → (Approval if needed) → Checkout Agent → Order
```

## Setup

### Prerequisites

- Python 3.10+
- pip

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
DEBUG=true
```

### Running

```bash
python main.py
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login (form)
- `POST /auth/login/json` - Login (JSON)
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update profile

### Agent
- `POST /agent/task` - Create new shopping task
- `GET /agent/tasks` - List tasks
- `GET /agent/tasks/{id}` - Get task details
- `GET /agent/feed` - Get activity feed
- `PUT /agent/pause` - Pause agent
- `PUT /agent/resume` - Resume agent

### Orders
- `GET /orders` - List orders
- `GET /orders/{id}` - Get order details
- `GET /orders/stats` - Get statistics

### Approvals
- `GET /approvals` - List pending approvals
- `GET /approvals/count` - Get pending count
- `POST /approvals/{id}/approve` - Approve purchase
- `POST /approvals/{id}/decline` - Decline purchase

### Wallet
- `GET /wallet/cards` - List virtual cards
- `POST /wallet/cards` - Create card
- `PUT /wallet/cards/{id}/pause` - Pause card
- `PUT /wallet/cards/{id}/resume` - Resume card
- `DELETE /wallet/cards/{id}` - Destroy card
- `GET /wallet/transactions` - List transactions
- `GET /wallet/balance` - Get balance

### Rules
- `GET /rules` - Get spending rules
- `PUT /rules` - Update rules

### Dashboard
- `GET /dashboard/overview` - Get full dashboard data
- `GET /dashboard/stats` - Get statistics
- `GET /dashboard/feed` - Get activity feed

## Database

Uses SQLite for simplicity. Database file: `aisle.db`

Tables:
- `users` - User accounts
- `orders` - Purchase orders
- `approvals` - Pending approvals
- `virtual_cards` - Virtual card records
- `transactions` - Transaction history
- `agent_runs` - Agent task executions
- `spending_rules` - User spending rules
- `feed_events` - Activity feed events

## Agent Workflow

### Shopping Task Example

When a user submits "order my usual protein bars":

1. **Shopping Agent** extracts keywords and searches product database
2. **Comparison Agent** compares prices across merchants (Amazon, Flipkart, HealthKart, etc.)
3. **Rules Agent** checks against user's spending rules
4. If amount > approval threshold or other rules violated → **Creates Approval**
5. If rules pass → **Checkout Agent** generates virtual card and places order
6. Order confirmation and card destruction

### Spending Rules

- Monthly budget limits
- Category-specific limits (Groceries, Electronics, etc.)
- Approval thresholds (e.g., require approval above $50)
- Merchant whitelist/blacklist
- International transaction blocking

## Security

- JWT authentication
- Single-use virtual cards for payments
- Password hashing with bcrypt
- All purchases logged in immutable ledger

## Development

### Project Structure

```
backend/
├── main.py                 # FastAPI app
├── config.py               # Configuration
├── agents/                 # AutoGen agents
│   ├── orchestrator.py     # Main coordinator
│   ├── shopping_agent.py   # Product search
│   ├── comparison_agent.py # Price comparison
│   ├── rules_agent.py      # Rules enforcement
│   └── checkout_agent.py   # Checkout handler
├── routers/                # API routes
│   ├── auth.py
│   ├── agent.py
│   ├── orders.py
│   ├── approvals.py
│   ├── wallet.py
│   ├── rules.py
│   └── dashboard.py
├── services/               # Business logic
│   ├── auth_service.py
│   ├── agent_service.py
│   └── order_service.py
├── models/                 # Pydantic models
├── database/               # SQLAlchemy models
└── requirements.txt
```
