import pytest
import requests
import json

# This test assumes the backend is running at http://localhost:3000
BASE_URL = "http://localhost:3000"

def test_ner_consistency():
    """
    Regression test to ensure GlobeNER 2.0 output matches expected IndicNER behavior.
    """
    sample_text = "Narendra Modi visited New Delhi."
    
    response = requests.post(
        f"{BASE_URL}/api/analyze",
        json={"text": sample_text, "confidenceThreshold": 0.0}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check schema
    assert "entities" in data
    assert "language" in data
    
    # Check for expected entities (IndicNER standard)
    entities = data["entities"]
    labels = [e["label"] for e in entities]
    texts = [e["text"] for e in entities]
    
    assert "PER" in labels
    assert "LOC" in labels
    assert "Narendra Modi" in texts
    assert "New Delhi" in texts

if __name__ == "__main__":
    # Manual run
    test_ner_consistency()
    print("Regression test passed!")
