"""Shopping Agent - Searches and finds products across merchants."""

from typing import Dict, List, Any, Optional
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import TextMessage
from config import get_model_client
from .base import search_products, get_current_time_str

SHOPPING_AGENT_SYSTEM_PROMPT = """You are a Shopping Agent for Aisle, an AI-powered shopping assistant.

Your role is to:
1. Understand user's shopping requests (natural language)
2. Search for products across multiple online stores
3. Find the best options based on price, ratings, and availability
4. Report findings in a structured format

When searching:
- Always search for the exact product the user wants
- Look for alternatives if the exact item isn't available
- Consider product ratings and reviews
- Check stock availability

You should respond with structured JSON containing:
- products_found: list of products with name, price, merchant, rating, in_stock
- search_query: the query you used
- recommendation: your top recommendation and why

Be concise and efficient in your responses."""


class ShoppingAgent:
    """Agent that searches for products across multiple merchants."""

    def __init__(self):
        self.model_client = get_model_client()
        self.agent = AssistantAgent(
            name="ShoppingAgent",
            system_message=SHOPPING_AGENT_SYSTEM_PROMPT,
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

    async def search(self, task: str) -> Dict[str, Any]:
        """
        Search for products based on user task.

        Args:
            task: Natural language shopping request

        Returns:
            Dictionary with search results and recommendation
        """
        self.steps = []
        self.log_step("Analyzing request", f"Understanding: {task}")

        # Extract product keywords from task
        keywords = self._extract_keywords(task)
        self.log_step("Keywords extracted", f"Searching for: {', '.join(keywords)}")

        # Search for products
        all_products = []
        for keyword in keywords:
            products = search_products(keyword)
            all_products.extend(products)
            self.log_step("Searched store", f"Found {len(products)} results for '{keyword}'")

        # Remove duplicates
        seen = set()
        unique_products = []
        for p in all_products:
            key = (p["name"], p["merchant"])
            if key not in seen:
                seen.add(key)
                unique_products.append(p)

        # Sort by price
        unique_products.sort(key=lambda x: x["price"])

        # Get recommendation
        recommendation = None
        if unique_products:
            # Prefer items that are in stock and have good ratings
            in_stock = [p for p in unique_products if p["in_stock"]]
            if in_stock:
                # Best value: lowest price with rating >= 4.0
                good_rated = [p for p in in_stock if p["rating"] >= 4.0]
                recommendation = good_rated[0] if good_rated else in_stock[0]
            else:
                recommendation = unique_products[0]

            self.log_step("Analysis complete", f"Best option: {recommendation['name']} at ${recommendation['price']:.2f}")

        return {
            "products_found": unique_products[:10],  # Top 10
            "search_query": task,
            "keywords": keywords,
            "recommendation": recommendation,
            "stores_searched": list(set(p["merchant"] for p in unique_products)),
            "steps": self.steps
        }

    def _extract_keywords(self, task: str) -> List[str]:
        """Extract product keywords from natural language task."""
        # Common shopping terms to filter out
        stop_words = {
            "order", "buy", "get", "find", "search", "want", "need",
            "please", "can", "you", "i", "my", "the", "a", "an",
            "some", "few", "before", "after", "they", "run", "out",
            "usual", "regular", "favorite", "best", "cheap", "cheapest"
        }

        # Extract meaningful words
        words = task.lower().replace(",", " ").replace(".", " ").split()
        keywords = [w for w in words if w not in stop_words and len(w) > 2]

        # Also check for common product categories
        categories = ["protein bars", "laptop", "headphones", "groceries", "supplements"]
        for category in categories:
            if category in task.lower():
                keywords.insert(0, category)

        return keywords[:3] if keywords else ["product"]
