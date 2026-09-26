/**
 * Typed API client for WageGuard India backend supporting JSON and SSE streaming.
 * Connects live to http://localhost:8000 (or VITE_API_URL).
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  window.location &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

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

export interface StatsResponse {
  states_count: number;
  sectors_count: number;
  citations_count: number;
  inspections_analyzed: number;
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
  const payload: { query: string; state?: string; language: string; stream: boolean } = {
    query,
    language,
    stream: false,
  };
  if (state && state.trim()) {
    payload.state = state.trim();
  }

  const response = await fetch(`${API_BASE_URL}/api/rights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Rights query failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Stream rights assistant answer using Server-Sent Events (SSE) for typing effect.
 */
export async function streamRights(
  query: string,
  state?: string,
  language: string = "en",
  onToken?: (token: string) => void,
  onComplete?: (result: RightsResponse) => void,
  onError?: (err: Error) => void
): Promise<void> {
  const payload: { query: string; state?: string; language: string; stream: boolean } = {
    query,
    language,
    stream: true,
  };
  if (state && state.trim()) {
    payload.state = state.trim();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/rights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Rights query failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No readable response body received.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;
        const lines = block.split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.replace("data:", "").trim();
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === "token" && parsed.token && onToken) {
              onToken(parsed.token);
            } else if (eventType === "done" && onComplete) {
              onComplete(parsed as RightsResponse);
            } else if (eventType === "error") {
              throw new Error(parsed.detail || "Streaming error from server.");
            }
          } catch (e) {
            console.error("SSE parse error", e);
          }
        }
      }
    }
  } catch (err) {
    if (onError) {
      onError(err instanceof Error ? err : new Error(String(err)));
    } else {
      throw err;
    }
  }
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

export async function fetchStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/stats`);
  if (!response.ok) {
    throw new Error(`Failed to load stats with status ${response.status}`);
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

export async function fetchLedgerProvisions(state?: string): Promise<any> {
  const url = state && state.trim()
    ? `${API_BASE_URL}/api/rights/provisions?state=${encodeURIComponent(state.trim())}`
    : `${API_BASE_URL}/api/rights/provisions`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Provisions lookup failed with status ${response.status}`);
  }
  return response.json();
}

