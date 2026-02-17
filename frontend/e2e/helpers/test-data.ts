const API_BASE = 'https://localhost:50135/api';

/**
 * Get an admin JWT token via direct API call.
 */
export async function getAdminToken(request: any, adminEmail: string, adminPassword: string): Promise<string> {
  const response = await request.post(`${API_BASE}/auth/Login`, {
    data: { email: adminEmail, password: adminPassword },
    ignoreHTTPSErrors: true,
  });
  const data = await response.json();
  return typeof data === 'string' ? data : (data.token || data.jwtToken);
}

/**
 * Create a category via API (requires admin token).
 */
export async function createCategory(request: any, token: string, name: string, description: string) {
  const response = await request.post(`${API_BASE}/categories`, {
    data: { name, description },
    headers: { Authorization: `Bearer ${token}` },
    ignoreHTTPSErrors: true,
  });
  return await response.json();
}

/**
 * Generate a unique string for test data to avoid conflicts.
 */
export function uniqueName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
