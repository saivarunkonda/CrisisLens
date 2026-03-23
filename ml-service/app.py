from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CrisisLens ML Service", version="0.1.0")


class PredictRequest(BaseModel):
    flood_risk: float
    heat_risk: float
    health_risk: float
    supply_risk: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    score = round(
        (req.flood_risk * 0.3)
        + (req.heat_risk * 0.25)
        + (req.health_risk * 0.25)
        + (req.supply_risk * 0.2),
        2,
    )
    return {"overall_risk": max(0, min(100, score))}
