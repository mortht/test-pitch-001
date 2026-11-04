import secrets
import string
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .catalog import get_product


class OrderItemIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    productId: str
    quantity: int


class OrderIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customerName: str = Field(min_length=1)
    email: str = Field(min_length=3, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    items: list[OrderItemIn]

    @field_validator("customerName")
    @classmethod
    def _name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Customer name is required")
        return v


class OrderError(Exception):
    pass


_ALPHA = string.ascii_uppercase + string.digits


def build_order(req: OrderIn) -> dict:
    if not req.items:
        raise OrderError("Order must contain at least one item")
    qty: dict[str, int] = {}
    for it in req.items:
        if it.quantity < 1:
            raise OrderError(f"Invalid quantity for {it.productId}")
        qty[it.productId] = qty.get(it.productId, 0) + it.quantity
    lines = []
    for pid, q in qty.items():
        p = get_product(pid)
        if p is None:
            raise OrderError(f"Unknown product: {pid}")
        if p.stock == 0:
            raise OrderError(f"{p.name} is out of stock")
        if q < 1:
            raise OrderError(f"Invalid quantity for {p.name}")
        if q > min(p.stock, 99):
            raise OrderError(f"Quantity for {p.name} exceeds available stock")
        lines.append({"productId": pid, "name": p.name, "unitPriceCents": p.priceCents,
                      "quantity": q, "lineTotalCents": p.priceCents * q})
    return {
        "orderNumber": "GG-" + "".join(secrets.choice(_ALPHA) for _ in range(8)),
        "customerName": req.customerName,
        "email": req.email,
        "items": lines,
        "totalCents": sum(l["lineTotalCents"] for l in lines),
        "currency": "EUR",
        "paymentSimulated": True,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
