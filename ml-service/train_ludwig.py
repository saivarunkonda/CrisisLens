import os
import pandas as pd
from ludwig.api import LudwigModel
from supabase import create_client, Client
import yaml

from sentence_transformers import SentenceTransformer

# Supabase configuration
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_data_from_supabase():
    if not url or not key:
        print("Supabase credentials not found. Using synthetic data for training.")
        return pd.DataFrame([
            {"flood_risk": 30, "heat_risk": 40, "health_risk": 35, "supply_risk": 25, "description": "Minor flooding reported near river bank", "overall_risk": 33},
            {"flood_risk": 60, "heat_risk": 55, "health_risk": 48, "supply_risk": 42, "description": "Severe heat wave affecting central district", "overall_risk": 54},
            {"flood_risk": 20, "heat_risk": 70, "health_risk": 30, "supply_risk": 25, "description": "Water supply issues reported in southern suburbs", "overall_risk": 41},
            {"flood_risk": 75, "heat_risk": 65, "health_risk": 60, "supply_risk": 50, "description": "Major flood emergency in industrial zone", "overall_risk": 66},
            {"flood_risk": 45, "heat_risk": 50, "health_risk": 52, "supply_risk": 40, "description": "Health clinics overwhelmed due to heat wave", "overall_risk": 48},
            {"flood_risk": 15, "heat_risk": 35, "health_risk": 25, "supply_risk": 20, "description": "Routine monitoring, no major incidents", "overall_risk": 24},
        ])
    
    supabase: Client = create_client(url, key)
    # Fetch historical data or risk assessments for training
    response = supabase.table("risk_assessments").select("flood_risk, heat_risk, health_risk, supply_risk, overall_risk, regions(name)").execute()
    # We also need reports for descriptions
    report_response = supabase.table("incident_reports").select("id, description, flood_risk:severity, heat_risk:severity, health_risk:severity, supply_risk:severity, overall_risk:severity").execute() # Mock mapping for demo
    
    data = response.data
    # In a real app we'd join assessments with reports/descriptions
    # For now, we'll use reports directly as training data if available
    reports = report_response.data
    
    if not reports and not data:
        print("No data found in Supabase. Using synthetic data.")
        return get_data_from_supabase()
    
    # If we have reports, we'll use them as they have descriptions
    if reports:
        # Generate embeddings for reports that don't have them
        for report in reports:
            if 'description' in report and report['description']:
                emb = embedding_model.encode(report['description']).tolist()
                supabase.table("incident_reports").update({"embedding": emb}).eq("id", report['id']).execute()
        return pd.DataFrame(reports)
    
    return pd.DataFrame(data)

def train():
    df = get_data_from_supabase()
    
    # Ensure description column exists
    if 'description' not in df.columns:
        df['description'] = ""
    
    # Load Ludwig config
    with open("ludwig_config.yaml", "r") as f:
        config = yaml.safe_load(f)
    
    model = LudwigModel(config)
    train_stats, preprocessed_data, output_directory = model.train(dataset=df)
    
    # Save the model
    model.save("ludwig_model")
    print(f"Model trained and saved to ludwig_model. Output directory: {output_directory}")

if __name__ == "__main__":
    train()
