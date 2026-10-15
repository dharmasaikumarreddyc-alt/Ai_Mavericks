"""Rules Agent - Enforces spending rules and guardrails."""

from typing import Dict, List, Any, Optional
from autogen_agentchat.agents import AssistantAgent
from config import get_model_client
from .base import check_spending_rules, get_current_time_str

RULES_AGENT_SYSTEM_PROMPT = """You are a Rules Enforcement Agent for Aisle, an AI-powered shopping assistant.

Your role is to:
1. Check purchases against user's spending rules
2. Enforce budget limits and category restrictions
3. Apply guardrails for security (approval thresholds, merchant restrictions)
4. Determine if user approval is required

Rules to check:
- Monthly budget limits
- Per-category spending limits
- Category enable/disable status
- Approval thresholds (purchases above X require approval)
- Merchant whitelist/blacklist
- International transaction blocking
- 2FA requirements for high-value purchases

Respond with:
- compliant: boolean indicating if purchase is allowed
- requires_approval: boolean indicating if user must approve
- issues: list of rule violations or concerns
- recommendations: suggestions for the user

Be strict but fair in applying rules. When in doubt, request approval."""


class RulesAgent:
    """Agent that enforces spending rules and guardrails."""

    def __init__(self):
        self.model_client = get_model_client()
        self.agent = AssistantAgent(
            name="RulesAgent",
            system_message=RULES_AGENT_SYSTEM_PROMPT,
            model_client=self.model_client,
        )
        self.steps = []

        # Default rules (will be overridden by user's saved rules)
        self.default_rules = {
            "monthly_budget": 25000,
            "current_spent": 0,
            "categories": [
                {"category": "Groceries", "enabled": True, "limit": 8000},
                {"category": "Health & Supplements", "enabled": True, "limit": 5000},
                {"category": "Electronics", "enabled": True, "limit": 10000},
                {"category": "Fashion", "enabled": False, "limit": 3000},
            ],
            "guardrails": {
                "require_approval_above": 2000,
                "block_international": False,
                "require_2fa_above": 5000,
                "auto_pause_on_suspicious": True
            },
            "merchant_whitelist": [],
            "merchant_blacklist": []
        }

    def log_step(self, action: str, detail: str):
        """Log an execution step."""
        self.steps.append({
            "time": get_current_time_str(),
            "action": action,
            "detail": detail
        })

    async def check_purchase(
        self,
        amount: float,
        merchant: str,
        category: str,
        user_rules: Dict = None
    ) -> Dict[str, Any]:
        """
        Check if a purchase complies with spending rules.

        Args:
            amount: Purchase amount
            merchant: Merchant name
            category: Product category
            user_rules: User's custom spending rules (optional)

        Returns:
            Dictionary with compliance status and any issues
        """
        self.steps = []
        rules = user_rules or self.default_rules

        self.log_step("Checking rules", f"Amount: ${amount:.2f}, Merchant: {merchant}, Category: {category}")

        issues = []
        requires_approval = False
        blocked = False

        # Check monthly budget
        monthly_budget = rules.get("monthly_budget", 25000)
        current_spent = rules.get("current_spent", 0)

        if current_spent + amount > monthly_budget:
            issues.append({
                "type": "budget",
                "message": f"Exceeds monthly budget",
                "detail": f"Budget: ${monthly_budget:.2f}, Already spent: ${current_spent:.2f}, This purchase: ${amount:.2f}"
            })
            requires_approval = True
            self.log_step("Budget check", "⚠️ Monthly budget would be exceeded")
        else:
            self.log_step("Budget check", f"✓ Within budget (${current_spent + amount:.2f}/${monthly_budget:.2f})")

        # Check category limits
        categories = rules.get("categories", [])
        category_found = False

        for cat in categories:
            if cat["category"].lower() == category.lower():
                category_found = True
                if not cat.get("enabled", True):
                    issues.append({
                        "type": "category_disabled",
                        "message": f"Category '{category}' is disabled",
                        "detail": "This category has been turned off in your spending rules"
                    })
                    requires_approval = True
                    self.log_step("Category check", f"⚠️ Category '{category}' is disabled")
                elif amount > cat.get("limit", float("inf")):
                    issues.append({
                        "type": "category_limit",
                        "message": f"Exceeds {category} category limit",
                        "detail": f"Limit: ${cat['limit']:.2f}, Purchase: ${amount:.2f}"
                    })
                    requires_approval = True
                    self.log_step("Category check", f"⚠️ Exceeds category limit (${cat['limit']:.2f})")
                else:
                    self.log_step("Category check", f"✓ Within {category} limit")
                break

        if not category_found:
            self.log_step("Category check", f"ℹ️ Category '{category}' not configured, applying defaults")

        # Check guardrails
        guardrails = rules.get("guardrails", {})

        # Approval threshold
        approval_threshold = guardrails.get("require_approval_above", 2000)
        if amount > approval_threshold:
            issues.append({
                "type": "approval_threshold",
                "message": f"Amount above auto-approval limit",
                "detail": f"Auto-approval limit: ${approval_threshold:.2f}, Purchase: ${amount:.2f}"
            })
            requires_approval = True
            self.log_step("Guardrail check", f"⚠️ Above approval threshold (${approval_threshold:.2f})")

        # Merchant blacklist
        blacklist = rules.get("merchant_blacklist", [])
        if any(b.lower() == merchant.lower() for b in blacklist):
            issues.append({
                "type": "merchant_blocked",
                "message": f"Merchant '{merchant}' is blocked",
                "detail": "This merchant is on your blocklist"
            })
            blocked = True
            self.log_step("Merchant check", f"🚫 Merchant '{merchant}' is blocked")

        # Merchant whitelist (if set, only allow whitelisted merchants)
        whitelist = rules.get("merchant_whitelist", [])
        if whitelist and not any(w.lower() == merchant.lower() for w in whitelist):
            issues.append({
                "type": "merchant_not_whitelisted",
                "message": f"Merchant '{merchant}' is not on your approved list",
                "detail": "Only whitelisted merchants are allowed"
            })
            requires_approval = True
            self.log_step("Merchant check", f"⚠️ Merchant not on whitelist")
        else:
            self.log_step("Merchant check", f"✓ Merchant '{merchant}' is allowed")

        # Compile result
        compliant = len(issues) == 0

        result = {
            "compliant": compliant,
            "requires_approval": requires_approval,
            "blocked": blocked,
            "issues": issues,
            "amount": amount,
            "merchant": merchant,
            "category": category,
            "steps": self.steps
        }

        if requires_approval and not blocked:
            result["approval_reason"] = issues[0]["message"] if issues else "Manual approval required"

        return result

    def get_approval_reason(self, check_result: Dict) -> str:
        """Get a human-readable approval reason from check result."""
        if not check_result.get("issues"):
            return "Manual approval requested"

        reasons = [issue["message"] for issue in check_result["issues"]]
        return "; ".join(reasons)
