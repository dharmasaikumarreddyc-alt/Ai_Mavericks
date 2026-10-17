from dataclasses import dataclass
from statistics import mean


@dataclass(frozen=True)
class Scenario:
    name: str
    items: int
    needs_filter: bool = False
    needs_substitution: bool = False


def baseline_interactions(s: Scenario) -> int:
    """A transparent workflow model, not observed human timing.

    Baseline assumes: search, optional filter, inspect each item, add each item,
    review cart, checkout. A substitution adds one extra search + inspect + replace.
    """
    interactions = 1 + (1 if s.needs_filter else 0) + (2 * s.items) + 2
    if s.needs_substitution:
        interactions += 3
    return interactions


def aisle_interactions(s: Scenario) -> int:
    """Modeled Loopora flow: describe need, review grounded basket, approve, checkout.

    A substitution adds one explicit approval step. This is a modeled interaction
    count only; it is not a claim about measured human completion time.
    """
    return 4 + (1 if s.needs_substitution else 0)


SCENARIOS = [
    Scenario("coffee-only", 1),
    Scenario("breakfast-pair", 2),
    Scenario("vegan-breakfast", 2, True),
    Scenario("healthy-bowl", 1, True),
    Scenario("indian-meal", 2, True),
    Scenario("south-indian-breakfast", 2, True),
    Scenario("bakery-snack", 2),
    Scenario("three-item-breakfast", 3),
    Scenario("budget-constrained", 2, True),
    Scenario("vegetarian-indian", 2, True),
    Scenario("coffee-and-pastry", 2),
    Scenario("healthy-breakfast", 2, True),
    Scenario("vegan-bowl-and-drink", 2, True),
    Scenario("stockout-breakfast", 2, True, True),
    Scenario("stockout-coffee", 1, False, True),
    Scenario("three-item-vegan", 3, True),
    Scenario("low-budget-single", 1),
    Scenario("category-filtered", 2, True),
    Scenario("merchant-comparison", 2, True),
    Scenario("mixed-constraints", 3, True, True),
]


def summarize():
    baseline = [baseline_interactions(s) for s in SCENARIOS]
    aisle = [aisle_interactions(s) for s in SCENARIOS]
    reductions = [1 - a / b for a, b in zip(aisle, baseline)]
    return {
        "scenarios": len(SCENARIOS),
        "baseline_mean_interactions": round(mean(baseline), 2),
        "aisle_mean_interactions": round(mean(aisle), 2),
        "mean_modeled_reduction_pct": round(mean(reductions) * 100, 1),
        "baseline_total_interactions": sum(baseline),
        "aisle_total_interactions": sum(aisle),
    }


if __name__ == "__main__":
    result = summarize()
    print("Loopora modeled interaction benchmark")
    print("NOTE: modeled workflow interactions; not observed human timing.")
    for key, value in result.items():
        print(f"{key}: {value}")
