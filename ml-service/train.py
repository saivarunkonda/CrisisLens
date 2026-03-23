import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor


def main():
    # Synthetic training sample for hackathon demo.
    X = np.array(
        [
            [30, 40, 35, 25],
            [60, 55, 48, 42],
            [20, 70, 30, 25],
            [75, 65, 60, 50],
            [45, 50, 52, 40],
            [15, 35, 25, 20],
        ]
    )
    y = np.array([33, 54, 41, 66, 48, 24])

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump(model, "model.joblib")
    print("Saved model.joblib")


if __name__ == "__main__":
    main()
