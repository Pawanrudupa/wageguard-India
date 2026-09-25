/**
 * Typed API client for WageGuard India backend.
 * Connects live to http://localhost:8000 (or VITE_API_URL).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface RiskResponse {
  state: string;
  sector: string;
  risk_label: "High" | "Medium" | "Low";
  explanation: string;
  data_confidence: "High" | "Medium" | "Low";
  irregularity_rate?: number;
  current_min_wage_rate?: number;
  probabilities?: Record<string, number>;
  inference_time_ms?: number;
}

export interface CitationSchema {
  source_file: string;
  act_name: string;
  section_or_clause: string;
  section_title?: string;
  state?: string;
  valid_as_of_date?: string;
}

export interface RightsResponse {
  answer: string;
  citations: CitationSchema[];
  disclaimer: string;
  language: string;
  grounded: boolean;
  next_steps?: string;
}

export interface CentralPortalItem {
  name: string;
  portal_url: string;
  helpline: string;
  scope: string;
  process: string;
}

export interface StateResourceItem {
  state: string;
  department: string;
  portal: string;
  helpline: string;
  head_office: string;
  procedure: string;
}

export interface ResourcesResponse {
  state?: string | null;
  central_portals: CentralPortalItem[];
  state_channel?: StateResourceItem | null;
  supported_states: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
  model_loaded: boolean;
  vector_store_ready: boolean;
}

export async function fetchRisk(state: string, sector: string): Promise<RiskResponse> {
  const params = new URLSearchParams({ state, sector });
  const response = await fetch(`${API_BASE_URL}/api/risk?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Risk lookup failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchRights(
  query: string,
  state?: string,
  language: string = "en"
): Promise<RightsResponse> {
  const payload: { query: string; state?: string; language: string } = {
    query,
    language,
  };
  if (state && state.trim()) {
    payload.state = state.trim();
  }

  const response = await fetch(`${API_BASE_URL}/api/rights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Rights query failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchResources(state?: string): Promise<ResourcesResponse> {
  const url = state && state.trim()
    ? `${API_BASE_URL}/api/resources?state=${encodeURIComponent(state.trim())}`
    : `${API_BASE_URL}/api/resources`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Resources lookup failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}
