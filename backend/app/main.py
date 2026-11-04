from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from .catalog import PRODUCTS
from .orders import OrderError, OrderIn, build_order

app = FastAPI()
DIST = Path("frontend/dist")


@app.get("/api/products")
def products():
    return [p.model_dump() for p in PRODUCTS]


@app.post("/api/orders", status_code=201)
def create_order(req: OrderIn):
    try:
        return build_order(req)
    except OrderError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/{path:path}")
def spa(path: str):
    if path.startswith("api/") or path == "api":
        raise HTTPException(status_code=404, detail="Not found")
    root = DIST.resolve()
    f = (root / path).resolve()
    if path and f.is_file() and f.is_relative_to(root):
        return FileResponse(f)
    index = root / "index.html"
    if index.is_file():
        return FileResponse(index)
    return JSONResponse({"detail": "Not found"}, status_code=404)
