/**
 * API Client for condo-py backend.
 *
 * Handles:
 * - Base URL configuration
 * - Access token injection
 * - Automatic token refresh on 401
 * - JSON parsing & error normalization
 */

const API_URL = "/api";

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

class ApiClient {
  private getTokens() {
    if (typeof window === "undefined") return null;
    const access = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    return access ? { access, refresh } : null;
  }

  private setTokens(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("selected_condominium");
  }

  private async refreshAccessToken(): Promise<boolean> {
    const tokens = this.getTokens();
    if (!tokens?.refresh) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refresh }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      if (data.access_token && data.refresh_token) {
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async fetch<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: ApiError | null }> {
    const tokens = this.getTokens();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (tokens?.access) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
    }

    let res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    // Auto-refresh on 401
    if (res.status === 401 && tokens?.refresh) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newTokens = this.getTokens();
        headers["Authorization"] = `Bearer ${newTokens!.access}`;
        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
        });
      }
    }

    if (!res.ok) {
      let message = "Error del servidor";
      try {
        const body = await res.json();
        message = body.detail || body.message || body.error || message;
      } catch {
        // no JSON body
      }
      return { data: null, error: { status: res.status, message } };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  }

  // Convenience methods
  get<T = unknown>(path: string) {
    return this.fetch<T>(path);
  }

  post<T = unknown>(path: string, body?: unknown) {
    return this.fetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = unknown>(path: string, body?: unknown) {
    return this.fetch<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = unknown>(path: string) {
    return this.fetch<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();
