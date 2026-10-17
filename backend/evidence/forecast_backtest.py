from statistics import mean


# Four weeks of synthetic daily unit demand, then one held-out week.
# Values are intentionally small and inspectable; this tests the directional
# same-weekday forecasting method, not production demand forecasting quality.
TRAIN_WEEKS = [
    [18, 20, 19, 22, 25, 31, 28],
    [17, 21, 20, 23, 26, 30, 29],
    [19, 22, 18, 24, 27, 32, 30],
    [18, 20, 21, 23, 25, 33, 31],
]
HELD_OUT = [19, 21, 20, 24, 26, 32, 30]


def forecast_same_weekday(train_weeks):
    return [round(mean(week[day] for week in train_weeks), 2) for day in range(7)]


def metrics(predicted, actual):
    errors = [abs(p - a) for p, a in zip(predicted, actual)]
    mae = mean(errors)
    wape = sum(errors) / sum(actual) if sum(actual) else 0.0
    return {"mae_units": round(mae, 3), "wape_pct": round(wape * 100, 2)}


def run_backtest():
    predicted = forecast_same_weekday(TRAIN_WEEKS)
    result = metrics(predicted, HELD_OUT)
    return {"predicted": predicted, "actual": HELD_OUT, **result}


if __name__ == "__main__":
    result = run_backtest()
    print("Loopora directional forecast backtest")
    print("NOTE: synthetic held-out data; not a production accuracy claim.")
    for key, value in result.items():
        print(f"{key}: {value}")
