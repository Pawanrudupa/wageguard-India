"""Pydantic request and response models for the WageGuard India API layer."""

from typing import ClassVar

from pydantic import BaseModel, ConfigDict, Field


class RiskResponse(BaseModel):
    """Prediction response from the state-sector wage risk model."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "state": "Maharashtra",
                "sector": "Construction",
                "risk_label": "High",
                "explanation": "High baseline non-compliance in Maharashtra Construction (irregularity rate 16.4%).",
                "data_confidence": "High",
                "irregularity_rate": 16.42,
                "current_min_wage_rate": 13832.0,
                "probabilities": {"High": 0.85, "Medium": 0.10, "Low": 0.05},
                "inference_time_ms": 0.04,
            }
        }
    )

    state: str = Field(..., description="Canonical state name", examples=["Maharashtra"])
    sector: str = Field(..., description="Economic sector", examples=["Construction"])
    risk_label: str = Field(..., description="Predicted risk tier (High, Medium, Low)", examples=["High"])
    explanation: str = Field(..., description="Feature-grounded justification for the risk prediction", examples=["High baseline non-compliance in Maharashtra Construction (irregularity rate 16.4%)."])
    data_confidence: str = Field(..., description="Data reporting confidence (High, Medium, Low)", examples=["High"])
    irregularity_rate: float | None = Field(None, description="Recent historical wage-law irregularity rate (%)", examples=[16.42])
    current_min_wage_rate: float | None = Field(None, description="Current monthly minimum wage rate in INR", examples=[13832.0])
    probabilities: dict[str, float] | None = Field(None, description="Model class probabilities", examples=[{"High": 0.85, "Medium": 0.10, "Low": 0.05}])
    inference_time_ms: float | None = Field(None, description="Prediction execution duration in ms", examples=[0.04])


class RightsRequest(BaseModel):
    """User query payload for the grounded legal rights assistant."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "Can my employer delay my final salary after I resign?",
                "state": "Delhi",
                "language": "en",
                "stream": True,
            }
        }
    )

    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="User question in English, Hindi, or Hinglish (max 500 characters)",
        examples=["Can my employer delay my final salary after I resign?"],
    )
    state: str | None = Field(
        None,
        max_length=50,
        description="Optional state to contextualize local minimum wages or rules",
        examples=["Delhi"],
    )
    language: str = Field(
        "en",
        max_length=10,
        description="Response language preference ('en' for English, 'hi' for Hindi)",
        examples=["en"],
    )
    stream: bool = Field(
        False,
        description="Whether to stream the response as Server-Sent Events (SSE)",
        examples=[False],
    )


class CitationSchema(BaseModel):
    """Traceable citation to legal statute, gazette notification, or official FAQ."""

    source_file: str = Field(..., description="Corpus file path", examples=["rag_store/corpus/central_acts/code_on_wages_2019_notes.md"])
    act_name: str = Field(..., description="Name of the statutory Act or Schedule", examples=["Code on Wages, 2019"])
    section_or_clause: str = Field(..., description="Section, rule, or clause number", examples=["Section 17"])
    section_title: str | None = Field(None, description="Title of the section", examples=["Time Limit for Payment of Wages"])
    state: str | None = Field("", description="State jurisdiction if applicable", examples=[""])
    valid_as_of_date: str | None = Field(None, description="Corpus validity date", examples=["2026-01-01"])


class RightsResponse(BaseModel):
    """Grounded answer payload with citations and mandatory legal disclaimer."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "answer": "Under Section 17(2) of the Code on Wages, 2019 (in force since 21 November 2025), when an employee resigns, wages earned must be paid within two working days...",
                "citations": [
                    {
                        "source_file": "rag_store/corpus/central_acts/code_on_wages_2019_notes.md",
                        "act_name": "Code on Wages, 2019",
                        "section_or_clause": "Section 17",
                        "section_title": "Time Limit for Payment of Wages",
                        "state": "",
                        "valid_as_of_date": "2026-01-01",
                    }
                ],
                "disclaimer": "This is educational information, not legal advice.",
                "language": "en",
                "grounded": True,
                "next_steps": "1. Call NALSA 24x7 Helpline at 15100.\n2. File grievance on Shram Suvidha Portal.",
            }
        }
    )

    answer: str = Field(..., description="Grounded, non-accusatory educational explanation")
    citations: list[CitationSchema] = Field(default_factory=list, description="Traceable statutory references")
    disclaimer: str = Field(
        ...,
        description="Mandatory legal disclaimer (educational only, not legal advice)",
        examples=["This is educational information, not legal advice."],
    )
    language: str = Field("en", description="Output language code", examples=["en"])
    grounded: bool = Field(True, description="Whether the answer is grounded in retrieved legal sources", examples=[True])
    next_steps: str | None = Field(None, description="Official grievance filing recommendations")


class LedgerProvisionsResponse(BaseModel):
    """Statutory provisions and notified rates from RAG corpus for auto-populating evidence PDF."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "state": "Maharashtra",
                "citations": [
                    {
                        "source_file": "rag_store/corpus/central_acts/code_on_wages_2019_notes.md",
                        "act_name": "Code on Wages, 2019",
                        "section_or_clause": "Section 17",
                        "section_title": "Time Limit for Payment of Wages",
                        "state": "",
                        "valid_as_of_date": "2026-01-01",
                    }
                ],
                "daily_min_wage_rate": 532.0,
                "sections_summary": {
                    "Section 17(2)": "Mandatory settlement of wages within 2 working days of resignation or dismissal.",
                    "Section 59": "Statutory burden of proof placed squarely on employer to prove payment of dues and lawful deductions.",
                    "Section 45(6)": "Unified 3-year limitation period to file claim before the adjudicating authority.",
                },
                "disclaimer": "Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation.",
            }
        }
    )

    state: str = Field(..., description="Target jurisdiction state name", examples=["Maharashtra"])
    citations: list[CitationSchema] = Field(default_factory=list, description="Traceable statutory references")
    daily_min_wage_rate: float | None = Field(None, description="Current daily minimum wage floor in INR", examples=[532.0])
    sections_summary: dict[str, str] = Field(default_factory=dict, description="Summary of governing legal sections")
    disclaimer: str = Field(
        "Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation.",
        description="Non-legal representation statutory disclaimer",
    )


class CentralPortalItem(BaseModel):
    """Contact and filing details for a central government grievance mechanism."""

    name: str = Field(..., examples=["Shram Suvidha Portal"])
    portal_url: str = Field(..., examples=["https://shramsuvidha.gov.in"])
    helpline: str = Field(..., examples=["1800-180-1555"])
    scope: str = Field(..., examples=["Central labour law violations, inspections, non-payment of minimum wages"])
    process: str = Field(..., examples=["Register online with mobile/Aadhaar and file grievance under appropriate Act."])


class StateResourceItem(BaseModel):
    """Contact details and formal complaint procedure for a state labour commissionerate."""

    state: str = Field(..., examples=["Maharashtra"])
    department: str = Field(..., examples=["Office of the Labour Commissioner, Government of Maharashtra"])
    portal: str = Field(..., examples=["https://mahakamgar.maharashtra.gov.in"])
    helpline: str = Field(..., examples=["1800-889-2816 / 022-26572631"])
    head_office: str = Field(..., examples=["Kamgar Bhavan, BKC, Bandra (E), Mumbai - 400051"])
    procedure: str = Field(..., examples=["File a formal claim under Section 15 of Payment of Wages Act at District Labour Office or MahaKamgar portal."])


class ResourcesResponse(BaseModel):
    """Curated contact directory for grievance redressal and free legal aid."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "state": "Maharashtra",
                "central_portals": [
                    {
                        "name": "NALSA Free Legal Aid",
                        "portal_url": "https://nalsa.gov.in",
                        "helpline": "15100",
                        "scope": "Free court-appointed advocates for workers under Legal Services Authorities Act",
                        "process": "Call 15100 (24x7 toll-free) for immediate legal appointment.",
                    }
                ],
                "state_channel": {
                    "state": "Maharashtra",
                    "department": "Office of the Labour Commissioner, Government of Maharashtra",
                    "portal": "https://mahakamgar.maharashtra.gov.in",
                    "helpline": "1800-889-2816 / 022-26572631",
                    "head_office": "Kamgar Bhavan, BKC, Bandra (E), Mumbai - 400051",
                    "procedure": "Register complaints via MahaKamgar grievance module or visit local ALC office.",
                },
                "supported_states": ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Kerala", "Telangana", "West Bengal"],
            }
        }
    )

    state: str | None = Field(None, description="Requested state filter if provided", examples=["Maharashtra"])
    central_portals: list[CentralPortalItem] = Field(..., description="Universal national portals (Shram Suvidha, EPFO, ESIC, NALSA)")
    state_channel: StateResourceItem | None = Field(None, description="State-specific labour department contact if available")
    supported_states: list[str] = Field(..., description="List of launch states with curated contacts")


class HealthResponse(BaseModel):
    """Service health and liveness probe response."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ok",
                "version": "0.1.0",
                "model_loaded": True,
                "vector_store_ready": True,
            }
        }
    )

    status: str = Field("ok", examples=["ok"])
    version: str = Field("0.1.0", examples=["0.1.0"])
    model_loaded: bool = Field(True, examples=[True])
    vector_store_ready: bool = Field(True, examples=[True])


class StatsResponse(BaseModel):
    """Aggregate statistics pulled from actual enforcement dataset and legal corpus."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            "example": {
                "states_count": 18,
                "sectors_count": 8,
                "citations_count": 61,
                "inspections_analyzed": 105600,
            }
        }
    )

    states_count: int = Field(..., description="Number of Indian States and UTs covered in empirical risk model", examples=[18])
    sectors_count: int = Field(..., description="Number of vulnerable economic sectors analyzed", examples=[8])
    statutes_count: int = Field(13, description="Number of statutory acts and official state schedules indexed in RAG corpus", examples=[13])
    citations_count: int = Field(..., description="Total verified statutory clauses and chunks in RAG corpus", examples=[61])
    inspections_analyzed: int = Field(..., description="Cumulative historical labour inspections evaluated", examples=[105600])


class AnalyticsResponse(BaseModel):
    """Anonymous aggregate-only analytics counter overview."""

    total_risk_inquiries: int = Field(..., description="Total anonymous risk checks performed", examples=[42])
    total_rights_inquiries: int = Field(..., description="Total anonymous rights inquiries performed", examples=[19])
    aggregate_counters: dict[str, int] = Field(default_factory=dict, description="State+sector combination counts only")
