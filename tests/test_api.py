import re
from fastapi.testclient import TestClient
from backend.app.main import app

c = TestClient(app)


def body(items, **kw):
    return {"customerName": "Ann", "email": "a@b.co", "items": items, **kw}


def test_products():
    r = c.get("/api/products").json()
    assert len(r) >= 12
    assert {p["category"] for p in r} == {"clubs", "balls", "bags", "apparel", "accessories"}
    assert any(p["stock"] == 0 for p in r)
    assert any(1 <= p["stock"] <= 5 for p in r)


def test_order_ok():
    r = c.post("/api/orders", json=body([{"productId": "tee-pack", "quantity": 3}]))
    assert r.status_code == 201
    j = r.json()
    assert re.match(r"^GG-[A-Z0-9]{8}$", j["orderNumber"])
    assert j["totalCents"] == 2397 and j["currency"] == "EUR" and j["paymentSimulated"]
    r2 = c.post("/api/orders", json=body([{"productId": "tee-pack", "quantity": 1}]))
    assert r2.json()["orderNumber"] != j["orderNumber"]


def test_business_errors():
    for items in ([], [{"productId": "nope", "quantity": 1}],
                  [{"productId": "tee-pack", "quantity": 0}],
                  [{"productId": "tee-pack", "quantity": 100}],
                  [{"productId": "tour-irons", "quantity": 5}],
                  [{"productId": "wedge-56", "quantity": 1}]):
        r = c.post("/api/orders", json=body(items))
        assert r.status_code == 400 and r.json()["detail"]


def test_422():
    ok = [{"productId": "tee-pack", "quantity": 1}]
    assert c.post("/api/orders", json=body(ok, cardNumber="4242")).status_code == 422
    assert c.post("/api/orders", json={"email": "a@b.co", "items": ok}).status_code == 422
    assert c.post("/api/orders", json={"customerName": "A", "items": ok}).status_code == 422


def test_multi_line_totals_and_fields():
    r = c.post("/api/orders", json=body([{"productId": "tee-pack", "quantity": 2},
                                         {"productId": "pro-driver", "quantity": 1}]))
    assert r.status_code == 201
    j = r.json()
    for it in j["items"]:
        assert set(it) == {"productId", "name", "unitPriceCents", "quantity", "lineTotalCents"}
        assert it["lineTotalCents"] == it["unitPriceCents"] * it["quantity"]
    assert j["totalCents"] == sum(i["lineTotalCents"] for i in j["items"])


def test_duplicate_and_negative_quantities():
    for items in ([{"productId": "tee-pack", "quantity": 5}, {"productId": "tee-pack", "quantity": -3}],
                  [{"productId": "tee-pack", "quantity": 0}, {"productId": "tee-pack", "quantity": 2}]):
        r = c.post("/api/orders", json=body(items))
        assert r.status_code == 400 and r.json()["detail"]


def test_blank_name_and_bad_email_422():
    assert c.post("/api/orders", json={**body([{"productId": "tee-pack", "quantity": 1}]),
                                       "customerName": "  "}).status_code == 422
    assert c.post("/api/orders", json={**body([{"productId": "tee-pack", "quantity": 1}]),
                                       "email": ""}).status_code == 422
