"""Comparison Agent - Compares prices across different merchants."""

from typing import Dict, List, Any, Optional
from autogen_agentchat.agents import AssistantAgent
from config import get_model_client
from .base import compare_prices, get_current_time_str

COMPARISON_AGENT_SYSTEM_PROMPT = """You are a Price Comparison Agent for Aisle, an AI-powered shopping assistant.

Your role is to:
1. Compare prices across multiple online merchants
2. Calculate potential savings
3. Identify the best deal considering price, shipping, and availability
4. Provide a clear comparison report

When comparing:
- Always show prices from multiple stores
- Consider shipping costs if available
- Note any coupons or discounts
- Highlight stock availability issues

Respond with structured comparison data including:
- best_deal: the recommended purchase option
- comparison_table: list of {store, price, savings}
- total_savings: money saved by choosing the best option
- confidence: how confident you are in this recommendation (high/medium/low)

Be data-driven and objective in your comparisons."""


class ComparisonAgent:
    """Agent that compares prices across multiple merchants."""

    def __init__(self):
        self.model_client = get_model_client()
        self.agent = AssistantAgent(
            name="ComparisonAgent",
            system_message=COMPARISON_AGENT_SYSTEM_PROMPT,
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

    async def compare(self, products: List[Dict], target_product: str = None) -> Dict[str, Any]:
        """
        Compare prices for products across merchants.

        Args:
            products: List of product results from search
            target_product: Optional specific product name to focus on

        Returns:
            Dictionary with comparison results and best deal
        """
        self.steps = []

        if not products:
            return {
                "best_deal": None,
                "comparison": [],
                "total_savings": 0,
                "confidence": "low",
                "steps": self.steps
            }

        # Get unique product names
        product_names = list(set(p["name"] for p in products))
        self.log_step("Products identified", f"Comparing {len(product_names)} unique products")

        # If target specified, filter
        if target_product:
            matching = [p for p in products if target_product.lower() in p["name"].lower()]
            if matching:
                products = matching
                self.log_step("Filtered results", f"Focusing on: {target_product}")

        # Group by product name
        product_groups = {}
        for p in products:
            name = p["name"]
            if name not in product_groups:
                product_groups[name] = []
            product_groups[name].append(p)

        # Find best deal for each product
        comparisons = []
        overall_best = None
        max_savings = 0

        for name, variants in product_groups.items():
            comparison = compare_prices(name, variants)

            if comparison["best_price"]:
                comparisons.append({
                    "product": name,
                    "best_store": comparison["best_price"]["merchant"],
                    "best_price": comparison["best_price"]["price"],
                    "comparison": comparison["comparison"],
                    "savings": comparison["savings"],
                    "stores_checked": comparison["stores_checked"]
                })

                if comparison["savings"] > max_savings:
                    max_savings = comparison["savings"]
                    overall_best = comparison["best_price"]
                elif overall_best is None:
                    overall_best = comparison["best_price"]

        self.log_step("Comparison complete", f"Checked {len(comparisons)} products across {len(set(p['merchant'] for p in products))} stores")

        if overall_best:
            self.log_step("Best deal found", f"{overall_best['name']} at ${overall_best['price']:.2f} from {overall_best['merchant']}")

        # Determine confidence
        stores_checked = len(set(p["merchant"] for p in products))
        if stores_checked >= 3 and len(comparisons) > 0:
            confidence = "high"
        elif stores_checked >= 2:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "best_deal": overall_best,
            "comparisons": comparisons,
            "total_savings": max_savings,
            "stores_checked": stores_checked,
            "confidence": confidence,
            "steps": self.steps
        }

    def generate_comparison_table(self, comparison_data: Dict) -> List[Dict]:
        """Generate a formatted comparison table for UI display."""
        if not comparison_data.get("comparisons"):
            return []

        # Flatten all comparisons into a single table
        table = []
        for comp in comparison_data["comparisons"]:
            for store_data in comp.get("comparison", []):
                table.append({
                    "store": store_data["store"],
                    "price": store_data["price"],
                    "is_best": store_data["price"] == comp["best_price"]
                })

        return table
