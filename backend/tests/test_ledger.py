"""Tests for the local-first work & wage ledger module.

Verifies zero-network privacy isolation, statutory citation retrieval,
limitation countdown rules under Section 45(6) Code on Wages 2019,
and PDF export title and disclaimer assertions.
"""

import re
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
LEDGER_DIR = FRONTEND_DIR / "src" / "lib" / "ledger"


def test_core_ledger_privacy_zero_network_imports():
    """CRITICAL PRIVACY TEST: Asserts zero networking imports in core ledger CRUD/storage modules.

    Modules checked:
    - db.ts
    - types.ts
    - countdown.ts
    - qr.ts
    None of these files may import fetch, axios, http, or any remote client.
    """
    assert LEDGER_DIR.exists(), f"Ledger directory not found at {LEDGER_DIR}"

    core_files = ["db.ts", "types.ts", "countdown.ts", "qr.ts"]
    prohibited_patterns = [
        re.compile(r"""import\s+.*(?:from\s+['"](?:axios|fetch|node-fetch|got|ky)['"]|['"]\./api['"])"""),
        re.compile(r"""\b(?:fetch|axios)\s*\("""),
        re.compile(r"""\bXMLHttpRequest\b"""),
        re.compile(r"""from\s+['"]\.\./\.\./lib/api['"]"""),
    ]

    for filename in core_files:
        filepath = LEDGER_DIR / filename
        assert filepath.exists(), f"Core module {filename} does not exist."
        content = filepath.read_text(encoding="utf-8")

        for pat in prohibited_patterns:
            matches = pat.findall(content)
            assert not matches, (
                f"Privacy violation in {filename}: Found networking code matching {pat.pattern}: {matches}"
            )


def test_countdown_contains_statutory_advisory_and_section_45_6():
    """Verify that countdown.ts implements the mandatory Code on Wages 2019 Section 45(6) rules."""
    countdown_file = LEDGER_DIR / "countdown.ts"
    content = countdown_file.read_text(encoding="utf-8")

    # Unified 3-year limitation
    assert "3 * 365" in content or "THREE_YEARS_MS" in content or "Section 45(6)" in content
    # Mandatory strategic advisory
    assert (
        "Statutory limit is 3 years, but acting sooner improves recovery chances before contractors relocate or dissolve."
        in content
    )
    # Section citation
    assert "Section 45(6), Code on Wages, 2019" in content


def test_pdf_export_contains_mandatory_title_and_disclaimer():
    """Verify that pdf.ts contains the locked statement title and mandatory non-representation disclaimer."""
    pdf_file = LEDGER_DIR / "pdf.ts"
    content = pdf_file.read_text(encoding="utf-8")

    # Title assertion: Empirical Statement of Work & Statutory Wage Arrears
    assert "Empirical Statement of Work & Statutory Wage Arrears" in content

    # Non-legal advice disclaimer assertion
    assert (
        "Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation."
        in content
    )


def test_ledger_provisions_endpoint_retrieval():
    """Verify that GET /api/rights/provisions returns grounded statutory sections."""
    response = client.get("/api/rights/provisions?state=Maharashtra")
    assert response.status_code == 200
    data = response.json()

    assert data["state"] == "Maharashtra"
    assert "daily_min_wage_rate" in data
    assert "sections_summary" in data

    sections = data["sections_summary"]
    assert any("17" in k for k in sections)
    assert any("59" in k for k in sections)
    assert any("45" in k for k in sections)

    # Verify burden of proof on employer
    assert any("employer" in v.lower() for v in sections.values())
    # Verify 3-year limitation
    assert any("3-year" in v.lower() or "3 year" in v.lower() for v in sections.values())
    # Verify 2 working days settlement
    assert any("2 working days" in v.lower() for v in sections.values())
