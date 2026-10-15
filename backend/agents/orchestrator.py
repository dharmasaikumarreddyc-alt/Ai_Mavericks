"""Orchestrator Agent - Coordinates all agents for shopping workflow."""

from typing import Dict, List, Any, Optional, Callable
from autogen_agentchat.agents import AssistantAgent
from config import get_model_client
from .shopping_agent import ShoppingAgent
from .comparison_agent import ComparisonAgent
from .rules_agent import RulesAgent
from .checkout_agent import CheckoutAgent
from .base import get_current_time_str
from datetime import datetime, timedelta
import asyncio
import json

ORCHESTRATOR_SYSTEM_PROMPT = """You are the Orchestrator Agent for Aisle, an AI-powered shopping assistant.

You coordinate a team of specialized agents:
1. ShoppingAgent - Searches for products
2. ComparisonAgent - Compares prices across stores
3. RulesAgent - Checks spending rules compliance
4. CheckoutAgent - Handles secure checkout

Your workflow:
1. Receive user's shopping request
2. Dispatch ShoppingAgent to find products
3. Have ComparisonAgent analyze prices
4. Check with RulesAgent for compliance
5. If approved, instruct CheckoutAgent to complete purchase
6. Report back with order confirmation or request user approval

Always prioritize:
- Finding the best price for the user
- Following user's spending rules
- Maintaining security with virtual cards
- Clear communication about what's happening

You are the main coordinator. Make decisions efficiently and keep the user informed."""


class AgentOrchestrator:
    """Main orchestrator that coordinates all shopping agents."""

    def __init__(self):
        self.model_client = get_model_client()

        # Initialize specialized agents
        self.shopping_agent = ShoppingAgent()
        self.comparison_agent = ComparisonAgent()
        self.rules_agent = RulesAgent()
        self.checkout_agent = CheckoutAgent()

        # Main orchestrator agent
        self.orchestrator = AssistantAgent(
            name="Orchestrator",
            system_message=ORCHESTRATOR_SYSTEM_PROMPT,
            model_client=self.model_client,
        )

        # Execution log
        self.execution_log = []
        self.feed_events = []

    def log_event(self, event_type: str, title: str, detail: str, status: str = "info"):
        """Log a feed event for the dashboard."""
        event = {
            "id": f"EVT-{len(self.feed_events) + 1:04d}",
            "type": event_type,
            "title": title,
            "detail": detail,
            "time": get_current_time_str(),
            "status": status
        }
        self.feed_events.append(event)
        return event

    async def process_task(
        self,
        task: str,
        user_id: str,
        user_rules: Dict = None,
        user_address: str = "123 Main St, Mumbai 400001",
        on_event: Callable = None
    ) -> Dict[str, Any]:
        """
        Process a shopping task end-to-end.

        Args:
            task: Natural language shopping request
            user_id: User ID for tracking
            user_rules: User's spending rules
            user_address: Delivery address
            on_event: Callback for real-time events

        Returns:
            Dictionary with task result
        """
        self.execution_log = []
        self.feed_events = []

        result = {
            "task": task,
            "user_id": user_id,
            "status": "running",
            "steps": [],
            "order": None,
            "approval_needed": None,
            "feed_events": []
        }

        try:
            # Step 1: Search for products
            self.log_event("search", "Searching products", f"Looking for: {task}", "pending")
            if on_event:
                on_event(self.feed_events[-1])

            search_result = await self.shopping_agent.search(task)
            result["steps"].extend(search_result.get("steps", []))

            if not search_result.get("products_found"):
                self.log_event("search", "No products found", "Could not find matching products", "info")
                result["status"] = "completed"
                result["message"] = "No products found matching your request"
                result["feed_events"] = self.feed_events
                return result

            stores_count = len(search_result.get("stores_searched", []))
            self.log_event(
                "search",
                "Products found",
                f"Found {len(search_result['products_found'])} options across {stores_count} stores",
                "success"
            )
            if on_event:
                on_event(self.feed_events[-1])

            # Step 2: Compare prices
            self.log_event("compare", "Comparing prices", "Analyzing deals across stores", "pending")
            if on_event:
                on_event(self.feed_events[-1])

            comparison_result = await self.comparison_agent.compare(
                search_result["products_found"],
                target_product=search_result.get("recommendation", {}).get("name")
            )
            result["steps"].extend(comparison_result.get("steps", []))

            best_deal = comparison_result.get("best_deal")
            if not best_deal:
                self.log_event("compare", "No deals available", "Could not find available products", "info")
                result["status"] = "completed"
                result["message"] = "Products found but none available for purchase"
                result["feed_events"] = self.feed_events
                return result

            savings = comparison_result.get("total_savings", 0)
            self.log_event(
                "compare",
                "Best deal found",
                f"{best_deal['name']} at ${best_deal['price']:.2f} from {best_deal['merchant']}" +
                (f" (Save ${savings:.2f})" if savings > 0 else ""),
                "success"
            )
            if on_event:
                on_event(self.feed_events[-1])

            result["comparison"] = comparison_result
            result["best_deal"] = best_deal

            # Step 3: Check spending rules
            self.log_event("approval", "Checking rules", "Verifying spending limits", "pending")
            if on_event:
                on_event(self.feed_events[-1])

            # Determine category from search
            category = self._infer_category(task)

            rules_check = await self.rules_agent.check_purchase(
                amount=best_deal["price"],
                merchant=best_deal["merchant"],
                category=category,
                user_rules=user_rules
            )
            result["steps"].extend(rules_check.get("steps", []))

            # Step 4: Handle based on rules check
            if rules_check.get("blocked"):
                self.log_event(
                    "approval",
                    "Purchase blocked",
                    rules_check.get("issues", [{}])[0].get("message", "Blocked by rules"),
                    "info"
                )
                result["status"] = "blocked"
                result["message"] = "Purchase blocked by spending rules"
                result["rules_check"] = rules_check
                result["feed_events"] = self.feed_events
                return result

            if rules_check.get("requires_approval"):
                # Need user approval
                approval_reason = self.rules_agent.get_approval_reason(rules_check)

                self.log_event(
                    "approval",
                    "Approval required",
                    approval_reason,
                    "pending"
                )
                if on_event:
                    on_event(self.feed_events[-1])

                # Create approval request
                expires_at = datetime.now() + timedelta(hours=6)

                result["status"] = "waiting"
                result["approval_needed"] = {
                    "merchant": best_deal["merchant"],
                    "item": best_deal["name"],
                    "qty": 1,
                    "amount": best_deal["price"],
                    "reason": approval_reason,
                    "expires_at": expires_at.isoformat(),
                    "expires": f"Expires in 6h 0m",
                    "comparison": comparison_result.get("comparisons", [{}])[0].get("comparison", [])
                }
                result["feed_events"] = self.feed_events
                return result

            # Rules passed - proceed with checkout
            self.log_event("approval", "Rules passed", "All spending rules satisfied", "success")
            if on_event:
                on_event(self.feed_events[-1])

            # Step 5: Prepare and execute checkout
            self.log_event("checkout", "Preparing checkout", f"Setting up secure payment", "pending")
            if on_event:
                on_event(self.feed_events[-1])

            preparation = await self.checkout_agent.prepare_checkout(
                product=best_deal,
                quantity=1,
                user_address=user_address
            )
            result["steps"].extend(preparation.get("steps", []))

            checkout_result = await self.checkout_agent.execute_checkout(
                preparation=preparation,
                approved=True
            )
            result["steps"].extend(checkout_result.get("steps", []))

            if checkout_result.get("success"):
                self.log_event(
                    "checkout",
                    "Order placed",
                    f"Order {checkout_result['order_id']} confirmed at {best_deal['merchant']}",
                    "success"
                )
                if on_event:
                    on_event(self.feed_events[-1])

                # Create order record
                order = await self.checkout_agent.create_order_record(
                    checkout_result=checkout_result,
                    agent_task=task
                )
                order["savings"] = savings

                result["status"] = "completed"
                result["order"] = order
                self.log_event(
                    "delivery",
                    "Order tracking",
                    f"Estimated delivery: {checkout_result.get('estimated_delivery', '2-3 days')}",
                    "info"
                )
            else:
                self.log_event("checkout", "Checkout failed", "Payment could not be processed", "info")
                result["status"] = "failed"
                result["message"] = "Checkout failed"

            result["feed_events"] = self.feed_events
            return result

        except Exception as e:
            self.log_event("error", "Task failed", str(e), "info")
            result["status"] = "failed"
            result["error"] = str(e)
            result["feed_events"] = self.feed_events
            return result

    async def approve_purchase(
        self,
        approval_data: Dict,
        user_address: str
    ) -> Dict[str, Any]:
        """
        Execute checkout after user approves a pending purchase.

        Args:
            approval_data: Approval details from approval_needed
            user_address: Delivery address

        Returns:
            Dictionary with checkout result
        """
        self.feed_events = []

        # Reconstruct product from approval data
        product = {
            "name": approval_data["item"],
            "price": approval_data["amount"],
            "merchant": approval_data["merchant"],
            "rating": 4.5,
            "in_stock": True
        }

        self.log_event("checkout", "Approval received", "Processing approved purchase", "success")

        preparation = await self.checkout_agent.prepare_checkout(
            product=product,
            quantity=approval_data.get("qty", 1),
            user_address=user_address
        )

        checkout_result = await self.checkout_agent.execute_checkout(
            preparation=preparation,
            approved=True
        )

        if checkout_result.get("success"):
            self.log_event(
                "checkout",
                "Order placed",
                f"Order {checkout_result['order_id']} confirmed",
                "success"
            )

            order = await self.checkout_agent.create_order_record(
                checkout_result=checkout_result,
                agent_task=f"Approved purchase: {approval_data['item']}"
            )

            return {
                "success": True,
                "order": order,
                "feed_events": self.feed_events
            }
        else:
            self.log_event("checkout", "Checkout failed", "Payment could not be processed", "info")
            return {
                "success": False,
                "message": "Checkout failed after approval",
                "feed_events": self.feed_events
            }

    def _infer_category(self, task: str) -> str:
        """Infer product category from task description."""
        task_lower = task.lower()

        category_keywords = {
            "Groceries": ["grocery", "groceries", "food", "vegetable", "fruit", "rice", "dal", "oil"],
            "Health & Supplements": ["protein", "vitamin", "supplement", "health", "medicine", "whey"],
            "Electronics": ["laptop", "phone", "headphone", "earphone", "charger", "cable", "electronic"],
            "Fashion": ["shirt", "pant", "dress", "shoe", "clothing", "fashion", "wear"],
        }

        for category, keywords in category_keywords.items():
            if any(kw in task_lower for kw in keywords):
                return category

        return "General"

    def get_feed_events(self) -> List[Dict]:
        """Get all feed events from this orchestration session."""
        return self.feed_events
