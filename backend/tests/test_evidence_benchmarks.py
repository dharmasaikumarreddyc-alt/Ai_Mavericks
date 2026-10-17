import unittest

from evidence.forecast_backtest import run_backtest
from evidence.impact_benchmark import summarize


class EvidenceBenchmarksTests(unittest.TestCase):
    def test_forecast_backtest_is_bounded_and_reproducible(self):
        result = run_backtest()
        self.assertEqual(len(result["predicted"]), 7)
        self.assertEqual(len(result["actual"]), 7)
        self.assertGreaterEqual(result["mae_units"], 0)
        self.assertGreaterEqual(result["wape_pct"], 0)
        self.assertLess(result["wape_pct"], 100)

    def test_interaction_model_reports_twenty_scenarios(self):
        result = summarize()
        self.assertEqual(result["scenarios"], 20)
        self.assertGreater(result["baseline_mean_interactions"], result["aisle_mean_interactions"])
        self.assertGreater(result["mean_modeled_reduction_pct"], 0)
        self.assertLess(result["mean_modeled_reduction_pct"], 100)


if __name__ == "__main__":
    unittest.main()
