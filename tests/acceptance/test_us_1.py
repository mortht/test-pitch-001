from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_products_catalog():
    r = client.get("/api/products")
    assert r.status_code == 200
    ps = r.json()
    assert len(ps) >= 12
    for p in ps:
        for k in ("id", "name", "category", "priceCents", "stock", "imageUrl", "description"):
            assert k in p
        assert isinstance(p["priceCents"], int) and p["priceCents"] > 0
    assert len({p["id"] for p in ps}) == len(ps)
    cats = {p["category"] for p in ps}
    assert {"clubs", "balls", "bags", "apparel", "accessories"} <= cats
    assert any(p["stock"] == 0 for p in ps)
    assert any(1 <= p["stock"] <= 5 for p in ps)
