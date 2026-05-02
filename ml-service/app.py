from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import os
import torch
import uvicorn

app = FastAPI(title="CrisisLens ML Service", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load Ludwig model if training has completed
ludwig_model = None
for candidate in ["results/api_experiment_run/model", "ludwig_model", "results"]:
    if os.path.exists(candidate):
        try:
            from ludwig.api import LudwigModel
            ludwig_model = LudwigModel.load(candidate)
            print(f"✅ Loaded Ludwig model from {candidate}")
            break
        except Exception as e:
            print(f"⚠️  Could not load Ludwig model from {candidate}: {e}")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🔧 Device: {device}")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
print("✅ Embedding model ready")


class PredictRequest(BaseModel):
    # Environment
    flood: float = 0
    extreme_heat: float = 0
    rain_storm: float = 0
    earthquake: float = 0
    hurricane: float = 0
    # Health
    health: float = 0
    pollution: float = 0
    food_scarcity: float = 0
    water_scarcity: float = 0
    pandemic: float = 0
    fatalities: float = 0
    # Society
    political_unrest: float = 0
    war_conflict: float = 0
    economic_crash: float = 0
    security: float = 0
    violent_crime: float = 0
    property_crime: float = 0
    cyber_attack: float = 0
    # Infrastructure
    supply_chain: float = 0
    traffic: float = 0
    power_outage: float = 0
    network_outage: float = 0
    fuel_shortage: float = 0
    # Optional text context
    description: str = ""


class EmbeddingRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "ludwig_loaded": ludwig_model is not None,
        "device": device,
        "factors_supported": 23,
    }


@app.post("/predict")
def predict(req: PredictRequest):
    if ludwig_model:
        try:
            data = [req.dict()]
            predictions, _ = ludwig_model.predict(dataset=data)
            score = float(predictions["overall_risk_predictions"].iloc[0])
            return {"overall_risk": max(0.0, min(100.0, score)), "source": "ludwig"}
        except Exception as e:
            print(f"Ludwig prediction error: {e}")

    # Fallback: weighted average across all 23 numeric factors
    numeric_vals = [v for k, v in req.dict().items() if isinstance(v, (int, float))]
    avg = sum(numeric_vals) / len(numeric_vals) if numeric_vals else 50.0
    return {"overall_risk": round(max(0.0, min(100.0, avg)), 2), "source": "fallback_average"}


@app.post("/embeddings")
def get_embeddings(req: EmbeddingRequest):
    try:
        embedding = embedding_model.encode(req.text).tolist()
        return {"embedding": embedding, "dimensions": len(embedding)}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
