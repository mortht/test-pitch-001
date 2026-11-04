from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEXT = (ROOT / "README.md").read_text(encoding="utf-8")


def test_exists_and_title():
    assert TEXT.lstrip().startswith("# ")


def test_purpose_and_features():
    low = TEXT.lower()
    assert "feature" in low and "catalog" in low and "cart" in low


def test_install_and_run():
    assert "3.14" in TEXT
    for s in ["FastAPI", "React", "npm run build", "serve.sh", "PORT"]:
        assert s in TEXT


def test_tests_command():
    assert "python -m pytest" in TEXT
    assert "npm test" in TEXT


def test_structure_mentions_real_files():
    for s in ["backend/app/main.py", "backend/app/catalog.py", "backend/app/orders.py", "frontend/src"]:
        assert s in TEXT
        if s.endswith(".py"):
            assert (ROOT / s).exists()


def test_api_endpoints():
    assert "/api/products" in TEXT and "/api/orders" in TEXT
