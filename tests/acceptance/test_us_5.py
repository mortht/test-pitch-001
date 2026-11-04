import re
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def products():
    return client.get("/api/products").json()


def body(items, **kw):
    b = {"customerName": "Ann", "email": "a@b.co", "items": items}
    b.update(kw)
    return b


def in_stock(min_stock=1):
    return [p for p in products() if p["stock"] >= min_stock]


def test_valid_order():
    ps = in_stock()
    a = ps[0]
    b = ps[1]
    r = client.post("/api/orders", json=body([
        {"productId": a["id"], "quantity": 1},
        {"productId": b["id"], "quantity": 1}]))
    assert r.status_code == 201
    o = r.json()
    assert re.match(r"^GG-[A-Z0-9]{8}$", o["orderNumber"])
    assert o["currency"] == "EUR"
    assert o["paymentSimulated"] is True
    assert len(o["items"]) == 2
    for it, p in zip(o["items"], [a, b]):
        assert it["name"] == p["name"]
        assert it["unitPriceCents"] == p["priceCents"]
        assert it["quantity"] == 1
        assert it["lineTotalCents"] == p["priceCents"]
    assert o["totalCents"] == a["priceCents"] + b["priceCents"]


def test_quantity_total_and_max_boundary():
    p = in_stock(2)[0]
    q = min(p["stock"], 99)
    r = client.post("/api/orders", json=body([{"productId": p["id"], "quantity": q}]))
    assert r.status_code == 201
    o = r.json()
    assert o["items"][0]["lineTotalCents"] == q * p["priceCents"]
    assert o["totalCents"] == q * p["priceCents"]


def test_distinct_order_numbers():
    p = in_stock()[0]
    nums = {client.post("/api/orders", json=body([{"productId": p["id"], "quantity": 1}])).json()["orderNumber"] for _ in range(5)}
    assert len(nums) == 5


def test_invalid_orders_400():
    ps = products()
    p = in_stock()[0]
    oos = [x for x in ps if x["stock"] == 0][0]
    cases = [
        [{"productId": "nope-xyz", "quantity": 1}],
        [{"productId": p["id"], "quantity": 0}],
        [{"productId": p["id"], "quantity": -1}],
        [{"productId": p["id"], "quantity": min(p["stock"], 99) + 1}],
        [{"productId": oos["id"], "quantity": 1}],
        [],
    ]
    for items in cases:
        r = client.post("/api/orders", json=body(items))
        assert r.status_code == 400, items
        assert r.json()["detail"]


def test_over_99_rejected():
    big = [p for p in products() if p["stock"] > 99]
    p = big[0] if big else in_stock()[0]
    r = client.post("/api/orders", json=body([{"productId": p["id"], "quantity": 100}]))
    assert r.status_code == 400


@pytest.mark.parametrize("extra", [{"cardNumber": "4242424242424242"}, {"foo": 1}])
def test_extra_fields_422(extra):
    p = in_stock()[0]
    r = client.post("/api/orders", json=body([{"productId": p["id"], "quantity": 1}], **extra))
    assert r.status_code == 422


def test_extra_field_in_item_422():
    p = in_stock()[0]
    r = client.post("/api/orders", json=body([{"productId": p["id"], "quantity": 1, "cardNumber": "1"}]))
    assert r.status_code == 422


def test_missing_fields_422():
    p = in_stock()[0]
    items = [{"productId": p["id"], "quantity": 1}]
    assert client.post("/api/orders", json={"email": "a@b.co", "items": items}).status_code == 422
    assert client.post("/api/orders", json={"customerName": "A", "items": items}).status_code == 422


def test_stock_not_decremented():
    p = in_stock()[0]
    before = products()
    client.post("/api/orders", json=body([{"productId": p["id"], "quantity": 1}]))
    assert products() == before
