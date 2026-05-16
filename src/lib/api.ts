const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Health Check Interfaces
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface HealthCheckResponse {
    status: "ok" | "degraded";
    timestamp: string;
    uptime: string;
    checks: {
        system_db: string;
        cache: string;
        queue: string;
        storage: string;
        php_version?: string;
        laravel_version?: string;
        environment?: string;
    };
}

interface DetailedHealthCheck {
    status: "ok" | "degraded";
    timestamp: string;
    response_time: string;
    uptime: string;
    checks: {
        system_db: {
            status: string;
            latency: string;
        };
        tenants: {
            total: number;
            active: number;
        };
        cache: {
            status: string;
            driver: string;
            latency: string;
        };
        disk: {
            free: string;
            total: string;
            used_pct: string;
        };
        memory: {
            current: string;
            peak: string;
            limit: string;
        };
        log_file: {
            size: string;
            exists: boolean;
        };
        queue: {
            driver: string;
            connection: string;
        };
    };
}

interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
            permissions: string[];
            is_active: boolean;
            last_login_at: string;
        };
        access_token: string;
        token_type: string;
        expires_in: number;
    };
}

interface UserProfile {
    success: boolean;
    message: string;
    data: {
        id: number;
        name: string;
        email: string;
        role: string;
        permissions: string[];
        is_active: boolean;
        last_login_at: string;
        created_at: string;
    };
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}

interface TenantModule {
    id: number;
    module_id: number;
    module_name: string;
    module_slug: string;
    module_description?: string;
    price_at_subscription: number;
    subscription_type: "monthly" | "yearly";
    activated_at: string;
    deactivated_at?: string | null;
    is_active: boolean;
}

interface TenantBranding {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    logo_thumb_url: string | null;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    subdomain: string;
    domain: string | null;
    logo_url: string | null;
    logo?: string | null;
    branding?: TenantBranding;
    status: "active" | "suspended" | "cancelled";
    contact_name?: string;
    contact_email: string;
    contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    suspension_reason?: string | null;
    suspended_at?: string | null;
    cancelled_at?: string | null;
    created_at: string;
    updated_at: string;
    institution_code?: string;
    modules?: TenantModule[];
    subscription_type?: "monthly" | "yearly";
    total_subscription_cost?: number;
}

interface TenantsListResponse {
    success: boolean;
    message: string;
    data: Tenant[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}

interface TenantResponse {
    success: boolean;
    message: string;
    data: Tenant;
}

interface CreateTenantData {
    name: string;
    slug?: string;
    subdomain?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    institution_prefix: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    // Branding
    logo?: File | null;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    // ✨ NEW: Module subscriptions
    modules: Array<{
        module_id: number;
        subscription_type: "monthly" | "yearly";
    }>;
}

interface CreateTenantResponse {
    success: boolean;  // may be undefined for older backend
    status?: string;   // 'success' | 'error'
    message: string;
    data: {
        institution_code: string;
        tenant: Tenant;
        database: string;
        subdomain_url: string;
        admin_credentials: {
            email: string;
            password: string;
        };
        modules: Array<{
            id: number;
            module_id: number;
            module_name: string;
            module_slug: string;
            price_at_subscription: number;
            subscription_type: "monthly" | "yearly";
            is_active: boolean;
        }>;
        subscription_summary: {
            total_modules: number;
            total_cost: number;
            monthly_cost: number;
            yearly_cost: number;
        };
        next_steps: string[];
    };
}

interface UpdateTenantData {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

interface TenantStatistics {
    success: boolean;
    message: string;
    data: {
        tenant_info: {
            id: number;
            name: string;
            slug: string;
            status: string;
        };
        users_count: number;
        branches_count: number;
        roles_count: number;
        created_at: string;
        days_active: number;
        database_name: string;
    };
}

interface TenantsListParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: "active" | "suspended" | "cancelled";
    sort?: "created_at" | "name" | "status";
    order?: "asc" | "desc";
}

class ApiService {
    private onUnauthorized?: () => void;
    private onRateLimited?: (retryAfterSeconds: number) => void;
    private _lastRateLimitInfo: RateLimitInfo | null = null;

    setUnauthorizedHandler(handler: () => void) {
        this.onUnauthorized = handler;
    }

    setRateLimitHandler(handler: (retryAfterSeconds: number) => void) {
        this.onRateLimited = handler;
    }

    get rateLimitInfo(): RateLimitInfo | null {
        return this._lastRateLimitInfo;
    }

    private getToken(): string | null {
        return localStorage.getItem("access_token");
    }

    private setToken(token: string): void {
        localStorage.setItem("access_token", token);
    }

    private removeToken(): void {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retryCount: number = 0
    ): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Track rate limit headers
            const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
            const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
            const rateLimitReset = response.headers.get("X-RateLimit-Reset");

            if (rateLimitLimit && rateLimitRemaining && rateLimitReset) {
                this._lastRateLimitInfo = {
                    limit: parseInt(rateLimitLimit, 10),
                    remaining: parseInt(rateLimitRemaining, 10),
                    reset: parseInt(rateLimitReset, 10),
                };
            }

            // Handle 429 Rate Limit
            if (response.status === 429) {
                const retryAfter = rateLimitReset
                    ? Math.ceil((parseInt(rateLimitReset, 10) * 1000 - Date.now()) / 1000)
                    : 60;
                const waitSeconds = Math.max(retryAfter, 1);

                if (this.onRateLimited) {
                    this.onRateLimited(waitSeconds);
                }

                // Auto-retry once after waiting
                if (retryCount < 1) {
                    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
                    return this.request<T>(endpoint, options, retryCount + 1);
                }

                throw {
                    success: false,
                    message: `Rate limited. Please try again in ${waitSeconds} seconds.`,
                    code: "RATE_LIMIT_EXCEEDED",
                };
            }

            // Try to parse JSON response, fallback to text if it fails
            let data: any;
            const contentType = response.headers.get("content-type");

            try {
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    // Server returned non-JSON (likely HTML error page)
                    const text = await response.text();
                    data = {
                        success: false,
                        message: response.ok
                            ? "Unexpected response format"
                            : `Server error (${response.status})`,
                        raw_response: text.substring(0, 500) // Include first 500 chars for debugging
                    };
                }
            } catch (parseError) {
                data = {
                    success: false,
                    message: `Failed to parse server response (${response.status})`
                };
            }

            if (!response.ok) {
                // Handle 401 Unauthorized - session expired
                if (response.status === 401) {
                    this.removeToken();
                    if (this.onUnauthorized) {
                        this.onUnauthorized();
                    }
                }

                // Log the full error for debugging
                console.error("API Error:", {
                    endpoint,
                    status: response.status,
                    data,
                    requestBody: options.body
                });

                // Always embed the HTTP status so callers can branch on it (e.g. 404 = not found)
                throw {
                    ...data,
                    status: response.status,
                    message: data.message || `HTTP ${response.status} error`
                };
            }

            return data;
        } catch (error) {
            // Also check if error is 401 in the catch block
            if (error && typeof error === "object" && "status" in error && error.status === 401) {
                this.removeToken();
                if (this.onUnauthorized) {
                    this.onUnauthorized();
                }
            }
            // Re-throw API errors as-is (they already carry `status` from the throw above).
            // Only replace with a generic network error when there's truly no structured error object.
            if (error && typeof error === "object") {
                throw error;
            }
            throw {
                success: false,
                message: "Network error. Please check your connection.",
            };
        }
    }

    // Authentication
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>(
            "/system/auth/login",
            {
                method: "POST",
                body: JSON.stringify(credentials),
            }
        );

        if (response.success && response.data.access_token) {
            this.setToken(response.data.access_token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        return response;
    }

    async logout(): Promise<{ success: boolean; message: string }> {
        try {
            const response = await this.request<{ success: boolean; message: string }>(
                "/system/auth/logout",
                {
                    method: "POST",
                }
            );
            return response;
        } finally {
            this.removeToken();
        }
    }

    async getProfile(): Promise<UserProfile> {
        return this.request<UserProfile>("/system/auth/me");
    }

    async refreshToken(): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>(
            "/system/auth/refresh",
            {
                method: "POST",
            }
        );

        if (response.success && response.data.access_token) {
            this.setToken(response.data.access_token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        return response;
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem("user");
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // System Health Monitoring
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Public health check — no auth required.
     * Use for status indicator in the dashboard header.
     * Uses /api/v1/health (note: different path prefix than other endpoints).
     */
    async getHealthCheck(): Promise<HealthCheckResponse> {
        try {
            const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/v1/health`, {
                headers: { Accept: "application/json" },
            });
            return await response.json();
        } catch {
            // Return an offline/degraded shape so the UI can react
            return {
                status: "degraded",
                timestamp: new Date().toISOString(),
                uptime: "unknown",
                checks: {
                    system_db: "unreachable",
                    cache: "unreachable",
                    queue: "unreachable",
                    storage: "unreachable",
                },
            };
        }
    }

    /**
     * Detailed health metrics — requires system admin JWT.
     * Use for the dedicated System Monitoring page.
     * Endpoint: GET /api/v1/health/detailed (accepts both system and api guards).
     */
    async getDetailedHealth(): Promise<DetailedHealthCheck> {
        return this.request<DetailedHealthCheck>("/v1/health/detailed");
    }

    // Tenant Management
    async listTenants(params?: TenantsListParams): Promise<TenantsListResponse> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/admin/tenants?${queryString}` : "/admin/tenants";

        return this.request<TenantsListResponse>(endpoint);
    }

    async createTenant(data: CreateTenantData): Promise<CreateTenantResponse> {
        // Must use multipart/form-data because of the logo file upload
        const formData = new FormData();
        formData.append("name", data.name);
        if (data.slug) formData.append("slug", data.slug);
        if (data.subdomain) formData.append("subdomain", data.subdomain);
        formData.append("email", data.email);
        if (data.phone) formData.append("phone", data.phone);
        if (data.address) formData.append("address", data.address);
        if (data.city) formData.append("city", data.city);
        if (data.state) formData.append("state", data.state);
        formData.append("country", data.country);
        formData.append("institution_prefix", data.institution_prefix);
        formData.append("admin_name", data.admin_name);
        formData.append("admin_email", data.admin_email);
        formData.append("admin_password", data.admin_password);

        // Branding fields
        if (data.logo) formData.append("logo", data.logo);
        if (data.primary_color) formData.append("primary_color", data.primary_color);
        if (data.secondary_color) formData.append("secondary_color", data.secondary_color);
        if (data.accent_color) formData.append("accent_color", data.accent_color);
        if (data.background_color) formData.append("background_color", data.background_color);

        // Modules — send as JSON array string or repeated fields
        data.modules.forEach((mod, index) => {
            formData.append(`modules[${index}][module_id]`, mod.module_id.toString());
            formData.append(`modules[${index}][subscription_type]`, mod.subscription_type);
        });

        const token = this.getToken();
        const headers: Record<string, string> = {
            Accept: "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/tenants`, {
                method: "POST",
                headers,
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.removeToken();
                    if (this.onUnauthorized) this.onUnauthorized();
                }
                throw result;
            }

            return result as CreateTenantResponse;
        } catch (error) {
            if (error && typeof error === "object" && "message" in error) throw error;
            throw { success: false, message: "Network error. Please check your connection." };
        }
    }

    async getTenant(id: number): Promise<TenantResponse> {
        return this.request<TenantResponse>(`/admin/tenants/${id}`);
    }

    async updateTenant(id: number, data: UpdateTenantData): Promise<TenantResponse> {
        return this.request<TenantResponse>(`/admin/tenants/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    async suspendTenant(id: number, reason?: string): Promise<TenantResponse> {
        return this.request<TenantResponse>(`/admin/tenants/${id}/suspend`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        });
    }

    async reactivateTenant(id: number): Promise<TenantResponse> {
        return this.request<TenantResponse>(`/admin/tenants/${id}/reactivate`, {
            method: "POST",
        });
    }

    async getTenantStatistics(id: number): Promise<TenantStatistics> {
        return this.request<TenantStatistics>(`/admin/tenants/${id}/statistics`);
    }

    async deleteTenant(id: number): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(
            `/admin/tenants/${id}`,
            {
                method: "DELETE",
            }
        );
    }

    // Modules Management
    async listModules(params?: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: "active" | "inactive";
        sort_by?: "name" | "monthly_price" | "yearly_price" | "is_active" | "created_at";
        sort_order?: "asc" | "desc";
    }): Promise<ModulesListResponse> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/admin/modules?${queryString}` : "/admin/modules";

        return this.request<ModulesListResponse>(endpoint);
    }

    async getModule(id: number): Promise<ModuleResponse> {
        return this.request<ModuleResponse>(`/admin/modules/${id}`);
    }

    async createModule(data: CreateModuleData): Promise<ModuleResponse> {
        return this.request<ModuleResponse>("/admin/modules", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateModule(id: number, data: Partial<CreateModuleData>): Promise<ModuleResponse> {
        return this.request<ModuleResponse>(`/admin/modules/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteModule(id: number): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(
            `/admin/modules/${id}`,
            {
                method: "DELETE",
            }
        );
    }

    async toggleModuleStatus(id: number): Promise<ModuleResponse> {
        return this.request<ModuleResponse>(`/admin/modules/${id}/toggle-status`, {
            method: "POST",
        });
    }

    // Tenant Modules Management
    async getTenantModules(tenantId: number): Promise<{ success: boolean; data: TenantModule[] }> {
        return this.request<{ success: boolean; data: TenantModule[] }>(
            `/admin/tenants/${tenantId}/modules`
        );
    }

    async addModuleToTenant(
        tenantId: number,
        data: { module_id: number; subscription_type: "monthly" | "yearly" }
    ): Promise<{ success: boolean; message: string; data: TenantModule }> {
        return this.request<{ success: boolean; message: string; data: TenantModule }>(
            `/admin/tenants/${tenantId}/modules`,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
    }

    async removeModuleFromTenant(
        tenantId: number,
        moduleId: number
    ): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(
            `/admin/tenants/${tenantId}/modules/${moduleId}`,
            {
                method: "DELETE",
            }
        );
    }

    async toggleTenantModule(
        tenantId: number,
        moduleId: number
    ): Promise<{ success: boolean; message: string; data: TenantModule }> {
        return this.request<{ success: boolean; message: string; data: TenantModule }>(
            `/admin/tenants/${tenantId}/modules/${moduleId}/toggle`,
            {
                method: "POST",
            }
        );
    }

    // ── Tenant Dashboard ──────────────────────────────────────────────────────

    async getTenantDashboardStats(tenantId: number): Promise<{ success: boolean; data: TenantDashboardStats }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/stats`);
    }

    async getTenantDashboardCustomers(
        tenantId: number,
        params: { page?: number; per_page?: number; search?: string; status?: string }
    ): Promise<{ success: boolean; data: TenantDashboardCustomersResponse }> {
        const qs = new URLSearchParams();
        if (params.page) qs.set("page", String(params.page));
        if (params.per_page) qs.set("per_page", String(params.per_page));
        if (params.search) qs.set("search", params.search);
        if (params.status) qs.set("status", params.status);
        const q = qs.toString();
        return this.request(`/admin/tenants/${tenantId}/dashboard/customers${q ? `?${q}` : ""}`);
    }

    async getTenantDashboardSavings(tenantId: number): Promise<{ success: boolean; data: TenantDashboardSavings }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/savings`);
    }

    async getTenantDashboardLoans(tenantId: number): Promise<{ success: boolean; data: TenantDashboardLoans }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/loans`);
    }

    async getTenantDashboardAssets(tenantId: number): Promise<{ success: boolean; data: TenantDashboardAssets }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/assets`);
    }

    async getTenantDashboardCooperatives(tenantId: number): Promise<{ success: boolean; data: TenantDashboardCooperatives }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/cooperatives`);
    }

    async getTenantDashboardInvestments(tenantId: number): Promise<{ success: boolean; data: TenantDashboardInvestments }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/investments`);
    }

    async getTenantDashboardServices(tenantId: number): Promise<{ success: boolean; data: TenantDashboardServices }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/services`);
    }

    async getTenantDashboardActivity(
        tenantId: number,
        params: { limit?: number; module?: string }
    ): Promise<{ success: boolean; data: TenantDashboardActivityItem[] }> {
        const qs = new URLSearchParams();
        if (params.limit) qs.set("limit", String(params.limit));
        if (params.module) qs.set("module", params.module);
        const q = qs.toString();
        return this.request(`/admin/tenants/${tenantId}/dashboard/activity${q ? `?${q}` : ""}`);
    }

    async getTenantDashboardFlags(
        tenantId: number,
        params: { resolved?: boolean }
    ): Promise<{ success: boolean; data: TenantDashboardFlag[] }> {
        const q = params.resolved ? "?resolved=true" : "";
        return this.request(`/admin/tenants/${tenantId}/dashboard/flags${q}`);
    }

    async resolveTenantDashboardFlag(
        tenantId: number,
        flagId: number
    ): Promise<{ success: boolean; message: string; data: { id: number; resolved: boolean } }> {
        return this.request(`/admin/tenants/${tenantId}/dashboard/flags/${flagId}/resolve`, {
            method: "PATCH",
        });
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tenant Dashboard Interfaces
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TenantDashboardStats {
    total_customers: number;
    new_customers_this_month: number;
    new_customers_last_month: number;
    active_customers: number;
    suspended_customers: number;
    total_transactions: number;
    transaction_volume: number;
    transaction_volume_this_month: number;
    total_revenue: number;
    revenue_this_month: number;
    total_savings_balance: number;
    total_deposits: number;
    total_withdrawals: number;
    total_branches: number;
    total_staff: number;
    last_activity_at: string | null;
}

interface TenantDashboardCustomer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    account_number: string | null;
    status: "active" | "inactive" | "suspended";
    savings_balance: number;
    loan_balance: number;
    investment_balance: number;
    cooperative_balance: number;
    total_balance: number;
    transactions_this_month: number;
    risk_flags: number;
    joined_at: string | null;
    last_active_at: string | null;
}

interface TenantDashboardCustomersMeta {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

interface TenantDashboardCustomersResponse {
    data: TenantDashboardCustomer[];
    meta: TenantDashboardCustomersMeta;
}

interface TenantDashboardActivityItem {
    id: number;
    module: "savings" | "loans" | "assets" | "services" | "cooperatives" | "investments";
    type: string;
    customer_name: string;
    amount: number;
    status: "completed" | "pending" | "failed" | "approved" | "rejected" | "disbursed";
    created_at: string;
}

interface TenantDashboardFlag {
    id: number;
    severity: "low" | "medium" | "high";
    type: string;
    customer_name: string;
    description: string;
    amount: number | null;
    created_at: string;
    resolved: boolean;
}

interface TenantDashboardSavings {
    total_accounts: number;
    active_accounts: number;
    total_balance: number;
    deposits_this_month: number;
    withdrawals_this_month: number;
    new_accounts_this_month: number;
    top_products: Array<{ name: string; count: number; balance: number }>;
    recent_transactions: TenantDashboardActivityItem[];
    weekly_deposits: number[];
    weekly_withdrawals: number[];
}

interface TenantDashboardLoans {
    total_applications: number;
    approved_loans: number;
    active_loans: number;
    disbursed_amount: number;
    outstanding_balance: number;
    overdue_loans: number;
    overdue_amount: number;
    repayments_this_month: number;
    npl_ratio: number;
    loan_to_deposit_ratio: number;
    recent_applications: Array<{
        id: number;
        applicant_name: string;
        amount: number;
        status: "pending" | "approved" | "disbursed" | "rejected";
        product: string;
        created_at: string;
    }>;
    overdue_list: Array<{ name: string; product: string; amount: number; days_overdue: number }>;
}

interface TenantDashboardAssets {
    total_assets: number;
    active_leases: number;
    total_financed: number;
    outstanding_balance: number;
    overdue_count: number;
    overdue_amount: number;
    asset_types: Array<{ type: string; count: number; value: number }>;
    recent: Array<{ id: number; customer_name: string; asset_type: string; amount: number; status: string; created_at: string }>;
}

interface TenantDashboardCooperatives {
    total_groups: number;
    total_members: number;
    total_contributions: number;
    total_payouts: number;
    active_cycles: number;
    completed_cycles: number;
    groups: Array<{ id: number; name: string; members: number; contributions: number; payout: number; cycle_end: string; status: "active" | "completed" | "paused" }>;
}

interface TenantDashboardInvestments {
    total_portfolios: number;
    total_invested: number;
    total_returns: number;
    roi_percentage: number;
    active_plans: number;
    matured_plans: number;
    plans: Array<{ id: number; customer_name: string; plan_name: string; amount: number; returns: number; roi: number; maturity_date: string; status: "active" | "matured" | "withdrawn" }>;
    plan_breakdown: Array<{ name: string; amount: number; count: number }>;
}

interface TenantDashboardServices {
    total_transactions: number;
    total_volume: number;
    airtime_volume: number;
    data_volume: number;
    bills_volume: number;
    transfers_volume: number;
    daily_counts: number[];
}

// Module Interfaces (Updated to match backend API)
interface Module {
    id: number;
    name: string;
    slug: string;
    description: string;
    monthly_price: number;  // Changed from price_monthly
    yearly_price: number;   // Changed from price_yearly
    is_active: boolean;
    yearly_savings: number;           // New computed field
    yearly_savings_percentage: number; // New computed field
    created_at: string;
    updated_at: string;
}

interface CreateModuleData {
    name: string;
    description: string;
    monthly_price: number;  // Changed from price_monthly
    yearly_price: number;   // Changed from price_yearly
    is_active?: boolean;    // Made optional (defaults to true in backend)
}

interface ModulesListResponse {
    status: string;  // Changed from success to status
    message?: string;
    data: Module[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}

interface ModuleResponse {
    status: string;  // Changed from success to status
    message: string;
    data: Module;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMS Provider Interfaces
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SmsProviderConfig {
    id: number;
    provider: string;
    api_base_url: string;
    api_key_hint: string;
    secret_key_hint: string | null;
    sender_id: string;
    channel: string;
    webhook_url: string | null;
    default_charge_per_sms: string;
    provider_cost_per_sms: string;
    profit_margin_percent: number;
    low_balance_threshold: number;
    max_retries: number;
    failure_rate_alert_threshold: string;
    mask_phone_numbers: boolean;
    require_2fa_for_key_rotation: boolean;
    auto_suspend_on_depletion: boolean;
    log_retention_days: number;
    is_active: boolean;
    last_test_at: string | null;
    last_test_status: "success" | "failed" | null;
    updated_at: string;
    updated_by: string | null;
    provider_balance: number | null;
    provider_balance_currency: string | null;
    provider_balance_error: string | null;
    provider_balance_fetched_at: string | null;
}

export interface ProviderBalanceResponse {
    provider: string;
    balance: number;
    currency: string;
    fetched_at: string;
}

export interface SaveSmsProviderPayload {
    provider: string;
    api_key?: string;
    secret_key?: string;
    api_base_url: string;
    sender_id: string;
    channel: string;
    webhook_url?: string;
    default_charge_per_sms: number;
    provider_cost_per_sms: number;
    low_balance_threshold: number;
    max_retries: number;
    failure_rate_alert_threshold: number;
    mask_phone_numbers: boolean;
    require_2fa_for_key_rotation: boolean;
    auto_suspend_on_depletion: boolean;
    log_retention_days: number;
}

export interface SmsProviderResponse {
    success: boolean;
    message: string;
    data: SmsProviderConfig;
}

export interface SmsTestResponse {
    success: boolean;
    message: string;
    data: {
        phone: string;
        provider: string;
        message_id: string;
        status: string;
        sent_at: string;
    };
}

export interface SmsRotateKeyResponse {
    success: boolean;
    message: string;
    data: {
        api_key_hint: string;
        rotated_at: string;
    };
}

// ─── SMS Provider API methods (added to ApiService below via extension) ───────

class SmsProviderApiService {
    // GET /admin/sms/provider
    async getConfig(): Promise<SmsProviderResponse> {
        return api.request<SmsProviderResponse>("/admin/sms/provider");
    }

    // POST /admin/sms/provider
    async saveConfig(payload: SaveSmsProviderPayload): Promise<SmsProviderResponse> {
        return api.request<SmsProviderResponse>("/admin/sms/provider", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    // POST /admin/sms/provider/test
    async testConnection(phone: string): Promise<SmsTestResponse> {
        return api.request<SmsTestResponse>("/admin/sms/provider/test", {
            method: "POST",
            body: JSON.stringify({ phone }),
        });
    }

    // GET /admin/sms/provider/balance — live refresh from Termii
    async getProviderBalance(): Promise<ProviderBalanceResponse> {
        const res = await api.request<{ success: boolean; data: ProviderBalanceResponse }>(
            "/admin/sms/provider/balance"
        );
        return res.data;
    }

    // POST /admin/sms/provider/rotate-key
    async rotateKey(new_api_key: string, otp_code?: string): Promise<SmsRotateKeyResponse> {
        return api.request<SmsRotateKeyResponse>("/admin/sms/provider/rotate-key", {
            method: "POST",
            body: JSON.stringify({ new_api_key, ...(otp_code ? { otp_code } : {}) }),
        });
    }
}


// ─── SMS Management Types ─────────────────────────────────────────────────────

export interface SmsDashboard {
    total_wallet_balance: number;
    total_sms_sent_all_time: number;
    total_sms_sent_today: number;
    avg_profit_margin_percent: number;
    total_revenue_all_time: number;
    total_provider_cost_all_time: number;
    total_net_profit_all_time: number;
    total_revenue_today: number;
    total_provider_cost_today: number;
    total_net_profit_today: number;
    low_balance_count: number;
    suspended_count: number;
    high_failure_rate_count: number;
    as_of?: string;
}

export interface SmsTodayBreakdownItem {
    institution_id: number;
    institution_name: string;
    sms_sent_today: number;
    charge_per_sms: number;
    provider_cost_per_sms: number;
    revenue_today: number;
    cost_today: number;
    profit_today: number;
    margin_percent: number;
}

export interface SmsTodayTotals {
    sms_sent_today: number;
    revenue_today: number;
    cost_today: number;
    profit_today: number;
}

export interface SmsInstitution {
    id: number;
    name: string;
    has_wallet: boolean;
    sms_balance: number;
    total_sms_sent: number;
    sms_sent_today: number;
    charge_per_sms: number;
    provider_cost_per_sms: number;
    profit_per_sms: number;
    margin_percent: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    failure_rate_percent: number;
    last_activity_at: string | null;
    status: "active" | "low_balance" | "suspended";
}

export interface SmsInstitutionDetail extends SmsInstitution {
    revenue_today: number;
    cost_today: number;
    profit_today: number;
}

export interface SmsLog {
    id: number;
    phone: string;
    type: string;
    status: "sent" | "delivered" | "failed" | "expired" | "rejected";
    sent_at: string;
    failure_reason: string | null;
    provider_message_id: string | null;
    charge: number;
    provider_cost: number;
}

export interface SmsTrendItem {
    date: string;
    sms_sent: number;
    revenue: number;
    cost: number;
    profit: number;
}

export interface SmsRevenueTrendItem {
    date: string;
    total_sms: number;
    revenue: number;
    cost: number;
    profit: number;
}

export interface SmsMonthlyProfitItem {
    month: string;
    year: number;
    revenue: number;
    cost: number;
    profit: number;
}

export interface SmsLeaderboardItem {
    rank: number;
    institution_id: number;
    institution_name: string;
    charge_per_sms: number;
    total_profit: number;
    profit_percent_of_max: number;
}

export interface SmsAlertItem {
    institution_id: number;
    name: string;
    balance?: number;
    failure_rate_percent?: number;
}

export interface SmsAlerts {
    low_balance: SmsAlertItem[];
    suspended: SmsAlertItem[];
    high_failure_rate: SmsAlertItem[];
}

export interface SmsSettings {
    default_charge_per_sms: number;
    provider_cost_per_sms: number;
    default_margin_percent?: number;
    low_balance_threshold: number;
    default_sender_id: string;
    max_retries: number;
    failure_alert_threshold_percent: number;
}

export interface CreateWalletPayload {
    charge_per_sms?: number;
    sender_id?: string;
}

export interface CreateWalletResponse {
    institution_id: number;
    institution_name: string;
    sms_balance: number;
    charge_per_sms: number;
    status: "active";
    created_at: string;
}

export interface FundInstitutionPayload {
    amount: number;
    charge_per_sms: number;
    note?: string;
}

export interface FundInstitutionResponse {
    institution_id: number;
    institution_name: string;
    units_credited: number;
    amount_paid_ngn: number;
    charge_per_sms: number;
    previous_balance: number;
    new_balance: number;
    your_profit: number;
    funded_at: string;
    funded_by: string;
}

export interface UpdateRatePayload {
    charge_per_sms: number;
    reason?: string;
}

export interface UpdateRateResponse {
    institution_id: number;
    institution_name: string;
    old_charge_per_sms: number;
    new_charge_per_sms: number;
    provider_cost_per_sms: number;
    new_margin_percent: number;
    updated_at: string;
    updated_by: string;
}

export interface UpdateStatusPayload {
    status: "active" | "suspended";
}

export interface UpdateStatusResponse {
    institution_id: number;
    status: "active" | "suspended";
}

export interface BulkFundItem {
    id: number;
    amount: number;
    charge_per_sms: number;
}

export interface BulkFundPayload {
    institutions: BulkFundItem[];
    note?: string;
}

export interface BulkFundResult {
    institution_id: number;
    units_credited: number;
    new_balance: number;
}

export interface BulkFundResponse {
    total_amount_ngn: number;
    total_units_credited: number;
    total_your_profit: number;
    results: BulkFundResult[];
}

// ─── SMS Management API Service ───────────────────────────────────────────────

type ApiResp<T> = { success: boolean; data: T };

class SmsManagementApiService extends ApiService {
    async getDashboard(): Promise<SmsDashboard> {
        const res = await this.request<ApiResp<SmsDashboard>>("/admin/sms/dashboard");
        return res.data;
    }

    async getTodayBreakdown(): Promise<{ institutions: SmsTodayBreakdownItem[]; totals: SmsTodayTotals; date: string }> {
        const res = await this.request<{
            success: boolean;
            data: SmsTodayBreakdownItem[];
            totals: SmsTodayTotals;
            date: string;
        }>("/admin/sms/today-breakdown");
        return {
            institutions: res?.data ?? [],
            totals: res?.totals ?? { sms_sent_today: 0, revenue_today: 0, cost_today: 0, profit_today: 0 },
            date: res?.date ?? "",
        };
    }

    async getInstitutions(params: Record<string, string | number> = {}): Promise<{
        institutions: SmsInstitution[];
        total: number;
        total_pages: number;
        page: number;
    }> {
        const qs = new URLSearchParams(
            Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
        ).toString();
        const res = await this.request<{
            success: boolean;
            data: SmsInstitution[];
            pagination: { total: number; total_pages: number; page: number };
        }>(`/admin/sms/institutions${qs ? "?" + qs : ""}`);
        return {
            institutions: res?.data ?? [],
            total: res?.pagination?.total ?? 0,
            total_pages: res?.pagination?.total_pages ?? 1,
            page: res?.pagination?.page ?? 1,
        };
    }

    async getInstitution(id: number): Promise<SmsInstitutionDetail> {
        const res = await this.request<ApiResp<SmsInstitutionDetail>>(`/admin/sms/institutions/${id}`);
        return res.data;
    }

    async getLogs(id: number, params: Record<string, string | number> = {}): Promise<{
        logs: SmsLog[];
        total: number;
        page: number;
    }> {
        const qs = new URLSearchParams(
            Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
        ).toString();
        const res = await this.request<{
            success: boolean;
            data: SmsLog[];
            pagination: { total: number; page: number };
        }>(`/admin/sms/institutions/${id}/logs${qs ? "?" + qs : ""}`);
        return {
            logs: res?.data ?? [],
            total: res?.pagination?.total ?? 0,
            page: res?.pagination?.page ?? 1,
        };
    }

    async getTrend(id: number, days = 7): Promise<SmsTrendItem[]> {
        const res = await this.request<ApiResp<SmsTrendItem[]>>(
            `/admin/sms/institutions/${id}/trend?days=${days}`
        );
        return res?.data ?? [];
    }

    async createWallet(id: number, payload: CreateWalletPayload = {}): Promise<CreateWalletResponse> {
        const res = await this.request<{ success: boolean; message: string; data: CreateWalletResponse }>(
            `/admin/sms/institutions/${id}/wallet`,
            { method: "POST", body: JSON.stringify(payload) }
        );
        return res.data;
    }

    async fundInstitution(id: number, payload: FundInstitutionPayload): Promise<FundInstitutionResponse> {
        const res = await this.request<{ success: boolean; message: string; data: FundInstitutionResponse }>(
            `/admin/sms/institutions/${id}/fund`,
            { method: "POST", body: JSON.stringify(payload) }
        );
        return res.data;
    }

    async updateRate(id: number, payload: UpdateRatePayload): Promise<UpdateRateResponse> {
        const res = await this.request<{ success: boolean; message: string; data: UpdateRateResponse }>(
            `/admin/sms/institutions/${id}/rate`,
            { method: "PATCH", body: JSON.stringify(payload) }
        );
        return res.data;
    }

    async updateStatus(id: number, payload: UpdateStatusPayload): Promise<UpdateStatusResponse> {
        const res = await this.request<{ success: boolean; message: string; data: UpdateStatusResponse }>(
            `/admin/sms/institutions/${id}/status`,
            { method: "PATCH", body: JSON.stringify(payload) }
        );
        return res.data;
    }

    async getRevenueTrend(days = 7): Promise<SmsRevenueTrendItem[]> {
        const res = await this.request<ApiResp<SmsRevenueTrendItem[]>>(
            `/admin/sms/charts/revenue-trend?days=${days}`
        );
        return res?.data ?? [];
    }

    async getMonthlyProfit(): Promise<SmsMonthlyProfitItem[]> {
        const res = await this.request<ApiResp<SmsMonthlyProfitItem[]>>("/admin/sms/charts/monthly-profit");
        return res?.data ?? [];
    }

    async getLeaderboard(): Promise<SmsLeaderboardItem[]> {
        const res = await this.request<ApiResp<SmsLeaderboardItem[]>>("/admin/sms/leaderboard");
        return res?.data ?? [];
    }

    async bulkFund(payload: BulkFundPayload): Promise<BulkFundResponse> {
        const res = await this.request<{ success: boolean; message: string; data: BulkFundResponse }>(
            "/admin/sms/institutions/bulk-fund",
            { method: "POST", body: JSON.stringify(payload) }
        );
        return res.data;
    }

    getExportUrl(id: number, params: Record<string, string> = {}): string {
        const token = localStorage.getItem("access_token") ?? "";
        const qs = new URLSearchParams({ ...params, token }).toString();
        const base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
        return `${base}/admin/sms/institutions/${id}/logs/export?${qs}`;
    }

    async getAlerts(): Promise<SmsAlerts> {
        const res = await this.request<ApiResp<SmsAlerts>>("/admin/sms/alerts");
        const d = res?.data;
        return {
            low_balance: Array.isArray(d?.low_balance) ? d.low_balance : [],
            suspended: Array.isArray(d?.suspended) ? d.suspended : [],
            high_failure_rate: Array.isArray(d?.high_failure_rate) ? d.high_failure_rate : [],
        };
    }

    async getSettings(): Promise<SmsSettings> {
        const res = await this.request<ApiResp<SmsSettings>>("/admin/sms/settings");
        return res.data;
    }

    async saveSettings(payload: Omit<SmsSettings, "default_margin_percent">): Promise<void> {
        await this.request<{ success: boolean; message: string }>("/admin/sms/settings", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }
}

export const api = new ApiService();
export const smsProviderApi = new SmsProviderApiService();
export const smsManagementApi = new SmsManagementApiService();

export type {
    LoginCredentials,
    LoginResponse,
    UserProfile,
    Tenant,
    TenantBranding,
    TenantModule,
    TenantsListResponse,
    TenantResponse,
    CreateTenantData,
    CreateTenantResponse,
    UpdateTenantData,
    TenantStatistics,
    TenantsListParams,
    Module,
    CreateModuleData,
    ModulesListResponse,
    ModuleResponse,
    HealthCheckResponse,
    DetailedHealthCheck,
    RateLimitInfo,
    TenantDashboardStats,
    TenantDashboardCustomer,
    TenantDashboardCustomersMeta,
    TenantDashboardCustomersResponse,
    TenantDashboardActivityItem,
    TenantDashboardFlag,
    TenantDashboardSavings,
    TenantDashboardLoans,
    TenantDashboardAssets,
    TenantDashboardCooperatives,
    TenantDashboardInvestments,
    TenantDashboardServices,
};
