from pydantic import BaseModel


class Product(BaseModel):
    id: str
    name: str
    category: str
    priceCents: int
    stock: int
    imageUrl: str | None = None
    description: str


def _p(id, name, cat, price, stock, desc):
    return Product(id=id, name=name, category=cat, priceCents=price, stock=stock,
                   imageUrl=None, description=desc)


PRODUCTS: list[Product] = [
    _p("pro-driver", "Pro Driver", "clubs", 34999, 12, "460cc titanium driver."),
    _p("tour-irons", "Tour Iron Set", "clubs", 69900, 4, "Forged 4-PW iron set."),
    _p("speed-putter", "Speed Putter", "clubs", 18950, 8, "Milled face blade putter."),
    _p("wedge-56", "56° Sand Wedge", "clubs", 12900, 0, "Versatile sand wedge."),
    _p("distance-balls", "Distance Balls (12)", "balls", 2999, 50, "Dozen long-distance balls."),
    _p("tour-balls", "Tour Balls (12)", "balls", 4999, 30, "Dozen urethane tour balls."),
    _p("practice-balls", "Practice Balls (24)", "balls", 2499, 3, "Two dozen range balls."),
    _p("stand-bag", "Lightweight Stand Bag", "bags", 17900, 15, "Dual-strap stand bag."),
    _p("cart-bag", "Cart Bag", "bags", 22900, 6, "14-way divider cart bag."),
    _p("polo-shirt", "Performance Polo", "apparel", 5900, 40, "Moisture-wicking polo."),
    _p("rain-jacket", "Rain Jacket", "apparel", 11900, 9, "Waterproof breathable jacket."),
    _p("golf-glove", "Leather Glove", "accessories", 1990, 100, "Soft cabretta glove."),
    _p("rangefinder", "Laser Rangefinder", "accessories", 24900, 5, "1000m laser rangefinder."),
    _p("tee-pack", "Bamboo Tees (100)", "accessories", 799, 200, "Pack of 100 tees."),
]

_BY_ID = {p.id: p for p in PRODUCTS}


def get_product(id: str) -> Product | None:
    return _BY_ID.get(id)
