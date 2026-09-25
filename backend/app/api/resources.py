"""FastAPI router for official grievance channels, government portals, and legal aid contacts."""


from fastapi import APIRouter, Query

from backend.app.api.schemas import (
    CentralPortalItem,
    ResourcesResponse,
    StateResourceItem,
)
from backend.app.ml.data_pipeline import normalize_state_name

router = APIRouter(prefix="/api/resources", tags=["Grievance Resources"])

CENTRAL_PORTALS: list[CentralPortalItem] = [
    CentralPortalItem(
        name="Shram Suvidha Portal (Ministry of Labour & Employment)",
        portal_url="https://shramsuvidha.gov.in",
        helpline="1800-180-1555",
        scope="Central labour law violations, inspections, wage complaints in factories, mines, ports, railways, and central establishments.",
        process="Register with mobile number/Aadhaar, select 'File Grievance/Violation', specify establishment, and track inspection status online.",
    ),
    CentralPortalItem(
        name="EPFO EPFiGMS (Employees' Provident Fund)",
        portal_url="https://epfigms.gov.in",
        helpline="1800-118-005",
        scope="Employer non-deposit of PF contributions, unauthorized PF deductions, delayed PF settlement or pension transfers.",
        process="Enter UAN or PPO number, upload salary slip showing PF deduction, and register complaint. Mandatory 30-day investigation.",
    ),
    CentralPortalItem(
        name="ESIC Grievance & Medical Benefits Portal",
        portal_url="https://www.esic.gov.in",
        helpline="1800-112-526 / 1800-113-839",
        scope="Medical care denial, employer failure to register worker or non-deposit of monthly ESI contributions.",
        process="Submit online grievance on ESIC portal or CPGRAMS (https://pgportal.gov.in) with employer ESIC code and wage slips.",
    ),
    CentralPortalItem(
        name="NALSA Free Legal Aid (National Legal Services Authority)",
        portal_url="https://nalsa.gov.in",
        helpline="15100",
        scope="Free court-appointed advocates for workers, low-income earners, and unorganised sector labour under Section 12(h) of Legal Services Authorities Act.",
        process="Call national toll-free helpline 15100 (available 24x7) or visit nearest District Legal Services Authority (DLSA) at the district court.",
    ),
]

STATE_CHANNELS: dict[str, StateResourceItem] = {
    "Delhi": StateResourceItem(
        state="Delhi",
        department="Labour Department, Government of NCT of Delhi",
        portal="https://labour.delhi.gov.in",
        helpline="011-23813845 / 1031 (Citizen Helpline)",
        head_office="5-Sham Nath Marg, Civil Lines, Delhi - 110054",
        procedure="File claim under Section 15 of Payment of Wages Act or Section 20 of Minimum Wages Act at the District Labour Office (e.g. Pusa Road, Pushpa Bhawan).",
    ),
    "Maharashtra": StateResourceItem(
        state="Maharashtra",
        department="Office of the Labour Commissioner, Government of Maharashtra",
        portal="https://mahakamgar.maharashtra.gov.in",
        helpline="1800-889-2816 / 022-26572631",
        head_office="Kamgar Bhavan, 'E' Block, C-20, Bandra-Kurla Complex, Bandra (East), Mumbai - 400051",
        procedure="Register grievance via MahaKamgar online module or visit local Assistant Labour Commissioner (ALC) office for conciliation.",
    ),
    "Karnataka": StateResourceItem(
        state="Karnataka",
        department="Department of Labour, Government of Karnataka",
        portal="https://labour.karnataka.gov.in",
        helpline="155214 / 080-22266180",
        head_office="Karmika Bhavan, Dairy Circle, Bannerghatta Road, Bengaluru - 560029",
        procedure="Submit grievance on e-Karmika (https://ekarmika.karnataka.gov.in) or approach the jurisdictional Labour Officer under the Karnataka Shops & Establishments Act.",
    ),
    "Tamil Nadu": StateResourceItem(
        state="Tamil Nadu",
        department="Labour Welfare and Skill Development Department, Government of Tamil Nadu",
        portal="https://labour.tn.gov.in",
        helpline="044-24335147 / 044-24335149",
        head_office="DMS Complex, Teynampet, Chennai - 600006",
        procedure="Complaints regarding wage denial, overtime, or unlawful deductions can be filed with the Inspector of Labour or Deputy Commissioner of Labour.",
    ),
    "Kerala": StateResourceItem(
        state="Kerala",
        department="Labour and Skills Department, Government of Kerala",
        portal="https://lc.kerala.gov.in",
        helpline="1800-425-55214 / 0471-2301249",
        head_office="Labour Commissionerate, Thozhil Bhavan, Vikas Bhavan P.O., Thiruvananthapuram - 695033",
        procedure="Lodge complaint on the Shramik portal or contact District Labour Officer (DLO). Headload workers can approach Kerala Headload Workers Welfare Board.",
    ),
    "Telangana": StateResourceItem(
        state="Telangana",
        department="Department of Labour, Employment, Training & Factories, Government of Telangana",
        portal="https://labour.telangana.gov.in",
        helpline="040-27633215 / 040-27633216",
        head_office="T. Anjaiah Bhavan, RTC Cross Roads, Musheerabad, Hyderabad - 500020",
        procedure="Submit unpaid wage claims to the Joint Commissioner of Labour or file via the Telangana Labour online grievance system.",
    ),
    "West Bengal": StateResourceItem(
        state="West Bengal",
        department="Labour Department, Government of West Bengal",
        portal="https://wblabour.gov.in",
        helpline="1800-103-0009",
        head_office="New Secretariat Buildings, 11th Floor, 1, K.S. Roy Road, Kolkata - 700001",
        procedure="Submit complaint through the 'Samadhan' grievance portal or visit Regional Labour Office (RLO) in your municipal borough.",
    ),
}

SUPPORTED_STATES: list[str] = sorted(STATE_CHANNELS.keys())


@router.get("", response_model=ResourcesResponse, summary="Get Official Grievance Channels")
def get_grievance_resources(
    state: str | None = Query(
        None,
        description="Optional state to retrieve local labour commissioner contacts",
        examples=["Maharashtra"],
    ),
) -> ResourcesResponse:
    """Retrieve verified official government grievance redressal channels and legal aid contacts.

    Always includes central dispute channels (Shram Suvidha, EPFO, ESIC, NALSA 15100).
    If a valid launch state is specified, attaches specific local commissioner contacts.
    """
    matched_channel: StateResourceItem | None = None
    if state:
        canonical_state = normalize_state_name(state)
        matched_channel = STATE_CHANNELS.get(canonical_state)

    return ResourcesResponse(
        state=state,
        central_portals=CENTRAL_PORTALS,
        state_channel=matched_channel,
        supported_states=SUPPORTED_STATES,
    )
