"""Checkout Agent - Handles the checkout and payment process."""

from typing import Dict, List, Any, Optional
from autogen_agentchat.agents import AssistantAgent
from config import get_model_client
from .base import generate_virtual_card, simulate_checkout, get_current_time_str
import random

CHECKOUT_AGENT_SYSTEM_PROMPT = """You are a Checkout Agent for Aisle, an AI-powered shopping assistant.

Your role is to:
1. Generate secure single-use virtual cards for payments
2. Execute checkout on merchant websites
3. Fill in shipping and payment details
4. Track order status and confirmations

Security practices:
- Always use single-use or merchant-locked cards
- Never expose full card numbers
- Verify merchant SSL/security before checkout
- Confirm total matches expected amount

Respond with:
- card_details: virtual card info (last4, type, limit)
- checkout_status: success/failure
- order_confirmation: order ID and details if successful
- steps_taken: list of checkout steps completed

Be secure and methodical in executing checkouts."""


class CheckoutAgent:
    """Agent that handles checkout and payment process."""

    def __init__(self):
        self.model_client = get_model_client()
        self.agent = AssistantAgent(
            name="CheckoutAgent",
            system_message=CHECKOUT_AGENT_SYSTEM_PROMPT,
            model_client=self.model_client,
        )
        self.steps = []

    def log_step(self, action: str, detail: str):
        """Log an execution step."""
        self.steps.append({
            "time": get_current_time_str(),
            "action": action,
            "detail": detail
        })

    async def prepare_checkout(
        self,
        product: Dict,
        quantity: int,
        user_address: str
    ) -> Dict[str, Any]:
        """
        Prepare checkout by generating virtual card and validating details.

        Args:
            product: Product to purchase
            quantity: Quantity to buy
            user_address: Delivery address

        Returns:
            Dictionary with checkout preparation details
        """
        self.steps = []

        merchant = product.get("merchant", "Unknown")
        price = product.get("price", 0)
        total = price * quantity

        self.log_step("Preparing checkout", f"{product['name']} x{quantity} from {merchant}")

        # Generate virtual card
        card_type = "single-use"  # Most secure for one-time purchases
        card_limit = total * 1.1  # 10% buffer for taxes/fees

        card = generate_virtual_card(
            card_type=card_type,
            limit=card_limit,
            merchant=merchant
        )

        self.log_step("Card generated", f"Single-use card •• {card['last4']} with ${card_limit:.2f} limit")

        # Prepare cart
        cart = {
            "items": [
                {
                    "name": product["name"],
                    "qty": quantity,
                    "price": price,
                    "merchant": merchant
                }
            ],
            "subtotal": total,
            "shipping": 0,  # Free shipping assumed
            "tax": 0,  # Tax included
            "total": total
        }

        self.log_step("Cart prepared", f"Total: ${total:.2f}")

        return {
            "card": card,
            "cart": cart,
            "merchant": merchant,
            "address": user_address,
            "ready_for_checkout": True,
            "steps": self.steps
        }

    async def execute_checkout(
        self,
        preparation: Dict,
        approved: bool = True
    ) -> Dict[str, Any]:
        """
        Execute the checkout process.

        Args:
            preparation: Checkout preparation from prepare_checkout
            approved: Whether the purchase has been approved

        Returns:
            Dictionary with checkout result
        """
        if not approved:
            self.log_step("Checkout blocked", "Awaiting user approval")
            return {
                "success": False,
                "status": "awaiting_approval",
                "message": "Purchase requires user approval",
                "steps": self.steps
            }

        merchant = preparation["merchant"]
        cart = preparation["cart"]
        card = preparation["card"]
        address = preparation["address"]

        self.log_step("Starting checkout", f"Connecting to {merchant}")

        # Simulate filling checkout form
        self.log_step("Filling details", "Entering shipping address")
        self.log_step("Payment setup", f"Using card •• {card['last4']}")

        # Execute checkout
        result = simulate_checkout(
            merchant=merchant,
            items=cart["items"],
            card=card,
            address=address
        )

        if result["success"]:
            self.log_step("Order placed", f"Order ID: {result['order_id']}")
            self.log_step("Card secured", f"Card •• {card['last4']} will be destroyed after transaction")

            # Calculate savings if any
            savings = 0  # Would be calculated from price comparison

            return {
                "success": True,
                "order_id": result["order_id"],
                "merchant": merchant,
                "items": cart["items"],
                "total": cart["total"],
                "savings": savings,
                "card_used": card["label"],
                "card_status": "destroyed",  # Single-use card destroyed
                "address": address,
                "estimated_delivery": result["estimated_delivery"],
                "steps": self.steps
            }
        else:
            self.log_step("Checkout failed", "Payment declined or error occurred")
            return {
                "success": False,
                "status": "failed",
                "message": "Checkout failed",
                "steps": self.steps
            }

    async def create_order_record(
        self,
        checkout_result: Dict,
        agent_task: str
    ) -> Dict[str, Any]:
        """
        Create an order record from successful checkout.

        Args:
            checkout_result: Result from execute_checkout
            agent_task: Original task that triggered this order

        Returns:
            Order record for database
        """
        from datetime import datetime

        if not checkout_result.get("success"):
            return None

        # Format date
        date_str = datetime.now().strftime("%b %d, %Y")

        # Create order steps timeline
        order_steps = []
        for step in checkout_result.get("steps", []):
            order_steps.append({
                "time": step["time"],
                "label": step["action"],
                "detail": step["detail"]
            })

        return {
            "id": checkout_result["order_id"],
            "merchant": checkout_result["merchant"],
            "items": checkout_result["items"],
            "total": checkout_result["total"],
            "savings": checkout_result.get("savings", 0),
            "date": date_str,
            "status": "processing",
            "agent_task": agent_task,
            "card": checkout_result["card_used"],
            "address": checkout_result["address"],
            "steps": order_steps
        }
