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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Interfaces
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface EmailItem {
    id: number;
    message_id: string;
    thread_id: string | null;
    direction: "inbound" | "outbound";
    from_email: string;
    from_name: string | null;
    to: string[] | string;
    cc: string[] | string;
    bcc: string[] | string;
    subject: string;
    body_html: string | null;
    body_text: string | null;
    is_read: boolean;
    sent_at: string;
    created_at: string;
}

export interface EmailListResponse {
    data: EmailItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface EmailDetailResponse {
    email: EmailItem;
    thread: EmailItem[];
}

export interface ComposeEmailData {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body_html: string;
    body_text: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email API Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class EmailApiService extends ApiService {
    // Normalise any Laravel response shape into a consistent EmailListResponse
    private normaliseList(res: any): EmailListResponse {
        // Unwrap top-level { success, data } envelope if present
        const payload = (res && typeof res === "object" && "data" in res) ? res.data : res;

        // Shape A — Laravel paginator: { data: [...], total, current_page, … }
        if (payload && Array.isArray(payload.data)) {
            return {
                data: payload.data,
                current_page: payload.current_page ?? 1,
                last_page:    payload.last_page    ?? 1,
                per_page:     payload.per_page     ?? 20,
                total:        payload.total        ?? payload.data.length,
            };
        }
        // Shape B — flat array
        if (Array.isArray(payload)) {
            return { data: payload, current_page: 1, last_page: 1, per_page: payload.length, total: payload.length };
        }
        // Shape C — { emails: [...], total }
        if (payload && Array.isArray(payload.emails)) {
            return { data: payload.emails, current_page: 1, last_page: 1, per_page: payload.emails.length, total: payload.total ?? payload.emails.length };
        }
        // Shape D — { items: [...] }
        if (payload && Array.isArray(payload.items)) {
            return { data: payload.items, current_page: 1, last_page: 1, per_page: payload.items.length, total: payload.total ?? payload.items.length };
        }

        console.warn("[EmailApiService] Unrecognised list response shape:", res);
        return { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 };
    }

    async getInbox(params: { per_page?: number; search?: string; unread?: boolean } = {}): Promise<EmailListResponse> {
        const qs = new URLSearchParams();
        if (params.per_page) qs.set("per_page", String(params.per_page));
        if (params.search)   qs.set("search",   params.search);
        if (params.unread)   qs.set("unread",   "true");
        const res = await this.request<any>(`/v1/system/emails/inbox?${qs}`);
        return this.normaliseList(res);
    }

    async getSent(params: { per_page?: number; search?: string } = {}): Promise<EmailListResponse> {
        const qs = new URLSearchParams();
        if (params.per_page) qs.set("per_page", String(params.per_page));
        if (params.search)   qs.set("search",   params.search);
        const res = await this.request<any>(`/v1/system/emails/sent?${qs}`);
        return this.normaliseList(res);
    }

    async getUnreadCount(): Promise<number> {
        const res = await this.request<any>("/v1/system/emails/unread-count");
        // Handle: { data: { unread_count } } or { unread_count } or plain number
        return (
            res?.data?.unread_count ??
            res?.unread_count       ??
            (typeof res?.data === "number" ? res.data : 0)
        );
    }

    async getEmail(id: number): Promise<EmailDetailResponse> {
        const res = await this.request<any>(`/v1/system/emails/${id}`);
        // Unwrap envelope
        const payload = (res && "data" in res) ? res.data : res;

        // Shape A — { email: {...}, thread: [...] }
        if (payload?.email) {
            return {
                email:  payload.email,
                thread: Array.isArray(payload.thread) ? payload.thread : [],
            };
        }
        // Shape B — email fields are at root level, thread as sibling
        if (payload?.id) {
            const { thread, ...email } = payload;
            return { email, thread: Array.isArray(thread) ? thread : [] };
        }

        console.warn("[EmailApiService] Unrecognised detail response shape:", res);
        throw new Error("Unexpected email detail response format");
    }

    async compose(data: ComposeEmailData): Promise<EmailItem> {
        const res = await this.request<any>(
            "/v1/system/emails/compose",
            { method: "POST", body: JSON.stringify(data) }
        );
        return res?.data ?? res;
    }

    async reply(id: number, data: { body_html: string; body_text: string }): Promise<EmailItem> {
        const res = await this.request<any>(
            `/v1/system/emails/${id}/reply`,
            { method: "POST", body: JSON.stringify(data) }
        );
        return res?.data ?? res;
    }

    async markAsRead(id: number): Promise<void> {
        await this.request(`/v1/system/emails/${id}/read`, { method: "PATCH" });
    }

    async deleteEmail(id: number): Promise<void> {
        await this.request(`/v1/system/emails/${id}`, { method: "DELETE" });
    }
}

export const emailApi = new EmailApiService();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Billing API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BillingInvoice {
    id: string;                  // e.g. "INV-2026-07-0012"
    tenant_id: number;
    tenant_name: string;
    tenant_email: string;
    tenant_slug: string;
    period: string;              // e.g. "July 2026"
    issued_date: string;         // ISO date "2026-07-01"
    due_date: string;            // ISO date "2026-07-06"
    amount: number;              // e.g. 35000
    status: "pending" | "sent" | "paid" | "overdue";
    paid_date: string | null;
    billing_mode: "flat_rate" | "per_module" | "per_usage";
}

export interface BillingConfig {
    billing_mode: "flat_rate" | "per_module" | "per_usage";
    flat_rate_ngn: number;
    due_days: number;
    currency: string;
    // Optional — returned once backend persists bank details in config table
    bank_name?: string;
    bank_account?: string;
    bank_account_name?: string;
}

export interface BillingConfigPatch {
    flat_rate_ngn?: number;
    due_days?: number;
    bank_name?: string;
    bank_account?: string;
    bank_account_name?: string;
}

interface BillingInvoicesResponse {
    success: boolean;
    data: BillingInvoice[];
}

interface BillingConfigResponse {
    success: boolean;
    data: BillingConfig;
}

interface BillingActionResponse {
    success: boolean;
    message: string;
    data?: { paid_date?: string };
}

class BillingApiService extends ApiService {
    async listInvoices(year: number, month: number): Promise<BillingInvoice[]> {
        const m = month.toString().padStart(2, "0");
        const res = await this.request<BillingInvoicesResponse>(
            `/admin/billing/invoices?year=${year}&month=${m}`
        );
        return Array.isArray(res?.data) ? res.data : [];
    }

    async getConfig(): Promise<BillingConfig> {
        const res = await this.request<BillingConfigResponse>("/admin/billing/config");
        return res.data ?? { billing_mode: "flat_rate", flat_rate_ngn: 35000, due_days: 5, currency: "NGN" };
    }

    async sendInvoice(id: string): Promise<BillingActionResponse> {
        return this.request<BillingActionResponse>(
            `/admin/billing/invoices/${id}/send`,
            { method: "POST" }
        );
    }

    async sendAllInvoices(year: number, month: number): Promise<BillingActionResponse> {
        const m = month.toString().padStart(2, "0");
        return this.request<BillingActionResponse>(
            `/admin/billing/invoices/send-all?year=${year}&month=${m}`,
            { method: "POST" }
        );
    }

    async markPaid(id: string): Promise<{ paid_date: string }> {
        const res = await this.request<BillingActionResponse>(
            `/admin/billing/invoices/${id}/mark-paid`,
            { method: "POST" }
        );
        return { paid_date: res.data?.paid_date ?? new Date().toISOString().split("T")[0] };
    }

    async updateConfig(patch: BillingConfigPatch): Promise<BillingConfig> {
        const res = await this.request<BillingConfigResponse>(
            "/admin/billing/config",
            { method: "PATCH", body: JSON.stringify(patch) }
        );
        return res.data;
    }

    async updateInvoiceAmount(id: string, amount: number): Promise<BillingInvoice> {
        const res = await this.request<{ success: boolean; data: BillingInvoice }>(
            `/admin/billing/invoices/${id}/amount`,
            { method: "PATCH", body: JSON.stringify({ amount }) }
        );
        return res.data;
    }
}

export const billingApi = new BillingApiService();

// ─── Analytics Types ──────────────────────────────────────────────────────────

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

export interface AnalyticsSummary {
    total_tenants: { value: number; change_value: number; change_percent: number; direction: "up" | "down"; label: string };
    active_users: { value: number; change_value: number; change_percent: number; direction: "up" | "down"; label: string };
    growth_rate: { value: number; unit: string; direction: "up" | "down"; label: string };
    avg_session_minutes: { value: number; change_value: number; direction: "up" | "down"; label: string };
}

export interface TenantGrowthPoint {
    label: string;
    date: string;
    total: number;
    new: number;
    churned: number;
}

export interface TenantGrowthResponse {
    period: string;
    granularity: string;
    series: TenantGrowthPoint[];
}

export interface UserActivityPoint {
    hour: string;
    avg_users: number;
}

export interface PlanDistributionItem {
    plan_name: string;
    plan_id: number;
    tenant_count: number;
    percent: number;
}

export interface TopTenantItem {
    tenant_id: number;
    tenant_name: string;
    tenant_slug: string;
    active_users: number;
    active_users_change_percent: number;
    direction: "up" | "down";
    total_transactions: number;
    plan_name: string;
}

export interface SystemPerformanceMetric {
    value: number;
    unit?: string;
    display?: string;
    status: "good" | "warning" | "critical";
    threshold_warning?: number;
    threshold_critical?: number;
}

export interface SystemPerformance {
    api_response_time_ms: SystemPerformanceMetric;
    database_queries_per_day: SystemPerformanceMetric & { display: string };
    error_rate_percent: SystemPerformanceMetric & { display: string };
    uptime_30d_percent: SystemPerformanceMetric & { display: string };
    active_tenant_databases: SystemPerformanceMetric;
    queued_jobs: SystemPerformanceMetric;
    overall_status: "operational" | "degraded" | "outage";
}

class AnalyticsApiService extends ApiService {
    async getSummary(period: AnalyticsPeriod = "30d"): Promise<AnalyticsSummary> {
        const res = await this.request<{ success: boolean; data: AnalyticsSummary }>(
            `/admin/analytics/summary?period=${period}`
        );
        return res.data;
    }

    async getTenantGrowth(period: AnalyticsPeriod = "12m"): Promise<TenantGrowthResponse> {
        const res = await this.request<{ success: boolean; data: TenantGrowthResponse }>(
            `/admin/analytics/tenant-growth?period=${period}`
        );
        return res.data;
    }

    async getUserActivity(period: AnalyticsPeriod = "30d"): Promise<UserActivityPoint[]> {
        const res = await this.request<{ success: boolean; data: { hourly_average: UserActivityPoint[] } }>(
            `/admin/analytics/user-activity?period=${period}`
        );
        return res.data.hourly_average;
    }

    async getPlanDistribution(): Promise<PlanDistributionItem[]> {
        const res = await this.request<{ success: boolean; data: PlanDistributionItem[] }>(
            "/admin/analytics/plan-distribution"
        );
        return res.data;
    }

    async getTopTenants(period: AnalyticsPeriod = "30d", limit = 10): Promise<TopTenantItem[]> {
        const res = await this.request<{ success: boolean; data: TopTenantItem[] }>(
            `/admin/analytics/top-tenants?period=${period}&limit=${limit}`
        );
        return res.data;
    }

    async getSystemPerformance(): Promise<SystemPerformance> {
        const res = await this.request<{ success: boolean; data: SystemPerformance }>(
            "/admin/analytics/system-performance"
        );
        return res.data;
    }
}

export const analyticsApi = new AnalyticsApiService();

// ─── Finance Types ────────────────────────────────────────────────────────────

export interface FinRevenueSummaryPeriod {
    revenue: number; expenses: number; net_profit: number; owner_draw: number;
}
export interface FinRevenueSummary {
    today: FinRevenueSummaryPeriod;
    week: FinRevenueSummaryPeriod;
    month: FinRevenueSummaryPeriod;
    year: FinRevenueSummaryPeriod;
    mrr: number; arr: number;
    gross_margin_percent: number; net_margin_percent: number;
    burn_rate: number; runway_months: number;
    outstanding_invoices: { count: number; amount: number };
    overdue_invoices: { count: number; amount: number };
    financial_health_score: number;
    investor_readiness_score: number;
}
export interface FinRevenueTrendPoint {
    month: string; year: number; label: string;
    revenue: number; expenses: number; gross_profit: number; net_profit: number;
}
export interface FinRevenueBySource {
    source_id: number; source_name: string; amount: number; percent: number; trend_percent: number;
}
export interface FinRevenueSource {
    id: number; name: string; description: string; category: string;
    gl_account_code: string; gl_account_name: string;
    integration_modules: string[]; auto_post: boolean;
    taxable: boolean; tax_rate: number;
    status: "active" | "inactive" | "coming_soon";
    mtd_revenue: number; created_at: string; created_by: string;
}
export interface FinRevenueEntry {
    id: string; source_id: number; source_name: string;
    institution_id: number; institution_name: string;
    invoice_id: string; amount: number; payment_method: string;
    payment_date: string; reference: string; gl_account: string;
    posted_by: string; post_type: "auto" | "manual"; module_origin: string;
    status: string; created_at: string;
}
export interface FinExpense {
    id: string; description: string; category: string; vendor: string; amount: number;
    payment_method: string; company_account_id: number; expense_date: string;
    reference: string; gl_account: string; receipt_url: string | null;
    status: "approved" | "pending" | "rejected";
    created_by: string; approved_by: string | null; approved_at: string | null;
    notes: string; is_recurring: boolean; recurrence_period: string | null;
}
export interface FinExpenseSummary {
    mtd_total: number; ytd_total: number; avg_daily: number;
    largest_category: { name: string; amount: number };
    by_category: { category: string; amount: number; percent: number }[];
    pending_approval: number; budget_utilization_percent: number;
}
export interface FinOwnerDraw {
    id: string; owner_name: string; amount: number; purpose: string; category: string;
    company_account_id: number; account_name: string; withdrawal_date: string;
    reference: string; approved_by: string; status: "approved" | "pending"; notes: string;
}
export interface FinOwnerDrawSummary {
    mtd: number; ytd: number; avg_monthly: number; total_records: number;
}
export interface FinCompanyAccount {
    id: number; name: string; bank: string; account_number: string; type: string;
    currency: "NGN" | "USD"; available_balance: number; ledger_balance: number;
    pending_debits: number; status: "active" | "frozen"; last_updated: string; txn_count: number;
}
export interface FinAccountTransaction {
    date: string; description: string; type: "credit" | "debit";
    amount: number; reference: string; balance: number;
}
export interface FinAccountPosition { ngn: number; usd: number; accounts_count: number; }
export interface FinJournalEntryLine { account_code: string; account_name: string; debit: number; credit: number; }
export interface FinJournalEntry {
    entry_id: string; date: string; description: string; reference: string;
    origin_module: string; lines: FinJournalEntryLine[];
    posted_by: string; created_at: string;
}
export interface FinChartOfAccount {
    code: string; name: string; type: string; parent_code: string | null;
    balance: number; is_system: boolean;
}
export interface FinTrialBalance {
    accounts: { code: string; name: string; debit: number; credit: number }[];
    totals: { debit: number; credit: number }; balanced: boolean;
}
export interface FinKPIs {
    mrr: number; arr: number; mrr_growth_percent: number; arr_growth_percent: number;
    gross_margin_percent: number; net_margin_percent: number; operating_margin_percent: number;
    cac: number; ltv: number; ltv_cac_ratio: number; churn_rate_percent: number;
    avg_revenue_per_institution: number; burn_rate: number; runway_months: number;
    financial_health_score: number; investor_readiness_score: number;
}
export interface FinAuditEntry {
    id: string; timestamp: string; user_id: number; user_name: string;
    module: string; action: string; record_id: string; description: string;
    before_value: unknown; after_value: unknown;
    ip_address: string; user_agent: string; reason: string | null;
}
export interface FinBudget {
    category: string; monthly_budget: number; ytd_budget: number; ytd_actual: number;
    variance: number; utilization_percent: number;
    status: "on_track" | "warning" | "over_budget";
}
export interface FinCashFlowSummary {
    opening_balance: number; cash_in: number; cash_out: number;
    net_cash_flow: number; closing_balance: number;
}
export interface FinCashFlowTrendPoint {
    month: string; cash_in: number; cash_out: number; net: number; balance: number;
}
export interface FinIncomeStatement {
    period: string;
    revenue: { total: number; lines: { source: string; amount: number }[] };
    cost_of_revenue: { total: number; lines: { item: string; amount: number }[] };
    gross_profit: number; gross_margin_percent: number;
    operating_expenses: { total: number; lines: { item: string; amount: number }[] };
    ebitda: number; other_income: number; other_expense: number;
    net_profit: number; net_margin_percent: number;
}
export interface FinBalanceSheet {
    assets: {
        current_assets: { cash: number; receivables: number; total: number };
        fixed_assets: { equipment: number; total: number };
        total_assets: number;
    };
    liabilities: {
        current_liabilities: { payables: number; tax_payable: number; total: number };
        total_liabilities: number;
    };
    equity: { owners_equity: number; retained_earnings: number; total_equity: number };
    check: { balanced: boolean; assets: number; liabilities_and_equity: number };
}

interface FinPaginatedMeta { total: number; page: number; per_page: number; last_page: number; }
interface FinPaginated<T> { data: T[]; meta: FinPaginatedMeta; }

class FinanceApiService extends ApiService {
    // ── Revenue Summary ───────────────────────────────────────────────────────
    async getRevenueSummary(): Promise<FinRevenueSummary> {
        const res = await this.request<{ success: boolean; data: FinRevenueSummary }>("/admin/finance/revenue/summary");
        return res.data;
    }
    async getRevenueTrend(months = 12): Promise<FinRevenueTrendPoint[]> {
        const res = await this.request<{ success: boolean; data: FinRevenueTrendPoint[] }>(`/admin/finance/revenue/trend?months=${months}`);
        return res.data;
    }
    async getRevenueBySource(period: "month" | "year" = "month"): Promise<FinRevenueBySource[]> {
        const res = await this.request<{ success: boolean; data: FinRevenueBySource[] }>(`/admin/finance/revenue/by-source?period=${period}`);
        return res.data;
    }

    // ── Revenue Sources (Config) ──────────────────────────────────────────────
    async listRevenueSources(status?: string): Promise<FinRevenueSource[]> {
        const q = status ? `?status=${status}` : "";
        const res = await this.request<{ success: boolean; data: FinRevenueSource[] }>(`/admin/finance/revenue-sources${q}`);
        return res.data;
    }
    async createRevenueSource(data: { name: string; description: string; category: string; gl_account_code: string; auto_post: boolean }): Promise<FinRevenueSource> {
        const res = await this.request<{ success: boolean; data: FinRevenueSource }>("/admin/finance/revenue-sources", { method: "POST", body: JSON.stringify(data) });
        return res.data;
    }
    async toggleRevenueSource(id: number): Promise<FinRevenueSource> {
        const res = await this.request<{ success: boolean; data: FinRevenueSource }>(`/admin/finance/revenue-sources/${id}/toggle`, { method: "PATCH" });
        return res.data;
    }

    // ── Revenue Entries ───────────────────────────────────────────────────────
    async listRevenueEntries(params?: { period?: string; source_id?: number; page?: number }): Promise<FinPaginated<FinRevenueEntry>> {
        const q = new URLSearchParams();
        if (params?.period) q.set("period", params.period);
        if (params?.source_id) q.set("source_id", String(params.source_id));
        if (params?.page) q.set("page", String(params.page));
        return this.request<FinPaginated<FinRevenueEntry>>(`/admin/finance/revenue?${q}`);
    }
    async createRevenueEntry(data: { source_id: number; institution_id?: number; amount: number; payment_method: string; payment_date: string; reference: string; description?: string; company_account_id: number }): Promise<FinRevenueEntry> {
        const res = await this.request<{ success: boolean; data: FinRevenueEntry }>("/admin/finance/revenue", { method: "POST", body: JSON.stringify(data) });
        return res.data;
    }

    // ── Expenses ──────────────────────────────────────────────────────────────
    async listExpenses(params?: { period?: string; category?: string; status?: string; page?: number }): Promise<FinPaginated<FinExpense>> {
        const q = new URLSearchParams();
        if (params?.period) q.set("period", params.period);
        if (params?.category) q.set("category", params.category);
        if (params?.status) q.set("status", params.status);
        if (params?.page) q.set("page", String(params.page));
        return this.request<FinPaginated<FinExpense>>(`/admin/finance/expenses?${q}`);
    }
    async getExpenseSummary(): Promise<FinExpenseSummary> {
        const res = await this.request<{ success: boolean; data: FinExpenseSummary }>("/admin/finance/expenses/summary");
        return res.data;
    }
    async createExpense(data: { description: string; category: string; vendor: string; amount: number; payment_method: string; company_account_id: number; expense_date: string; reference?: string; notes?: string; is_recurring: boolean; recurrence_period?: string }): Promise<FinExpense> {
        const res = await this.request<{ success: boolean; data: FinExpense }>("/admin/finance/expenses", { method: "POST", body: JSON.stringify(data) });
        return res.data;
    }
    async approveExpense(id: string, notes?: string): Promise<FinExpense> {
        const res = await this.request<{ success: boolean; data: FinExpense }>(`/admin/finance/expenses/${id}/approve`, { method: "POST", body: JSON.stringify({ notes }) });
        return res.data;
    }
    async rejectExpense(id: string, reason: string): Promise<FinExpense> {
        const res = await this.request<{ success: boolean; data: FinExpense }>(`/admin/finance/expenses/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
        return res.data;
    }
    async deleteExpense(id: string, reason: string): Promise<void> {
        await this.request<{ success: boolean }>(`/admin/finance/expenses/${id}`, { method: "DELETE", body: JSON.stringify({ reason }) });
    }

    // ── Owner's Draw ──────────────────────────────────────────────────────────
    async listOwnerDraws(year?: number): Promise<FinOwnerDraw[]> {
        const q = year ? `?year=${year}` : "";
        const res = await this.request<{ success: boolean; data: FinOwnerDraw[] }>(`/admin/finance/owners-draw${q}`);
        return res.data;
    }
    async getOwnerDrawSummary(): Promise<FinOwnerDrawSummary> {
        const res = await this.request<{ success: boolean; data: FinOwnerDrawSummary }>("/admin/finance/owners-draw/summary");
        return res.data;
    }
    async createOwnerDraw(data: { owner_name: string; amount: number; purpose: string; category: string; company_account_id: number; withdrawal_date: string; notes?: string }): Promise<FinOwnerDraw> {
        const res = await this.request<{ success: boolean; data: FinOwnerDraw }>("/admin/finance/owners-draw", { method: "POST", body: JSON.stringify(data) });
        return res.data;
    }
    async reverseOwnerDraw(id: string, reason: string): Promise<void> {
        await this.request<{ success: boolean }>(`/admin/finance/owners-draw/${id}/reverse`, { method: "POST", body: JSON.stringify({ reason }) });
    }

    // ── Company Accounts ──────────────────────────────────────────────────────
    async listCompanyAccounts(): Promise<FinCompanyAccount[]> {
        const res = await this.request<{ success: boolean; data: FinCompanyAccount[] }>("/admin/finance/accounts");
        return res.data;
    }
    async getAccountPosition(): Promise<FinAccountPosition> {
        const res = await this.request<{ success: boolean; data: FinAccountPosition }>("/admin/finance/accounts/position");
        return res.data;
    }
    async getAccountTransactions(id: number, params?: { from?: string; to?: string; type?: string; page?: number }): Promise<{ data: FinAccountTransaction[]; meta: { total: number } }> {
        const q = new URLSearchParams();
        if (params?.from) q.set("from", params.from);
        if (params?.to) q.set("to", params.to);
        if (params?.type) q.set("type", params.type);
        if (params?.page) q.set("page", String(params.page));
        return this.request<{ data: FinAccountTransaction[]; meta: { total: number } }>(`/admin/finance/accounts/${id}/transactions?${q}`);
    }
    async createTransfer(data: { from_account_id: number; to_account_id: number; amount: number; description: string; reference?: string }): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>("/admin/finance/accounts/transfer", { method: "POST", body: JSON.stringify(data) });
    }

    // ── General Ledger ────────────────────────────────────────────────────────
    async listJournalEntries(params?: { period?: string; account_code?: string; page?: number }): Promise<{ data: FinJournalEntry[]; meta: { total: number } }> {
        const q = new URLSearchParams();
        if (params?.period) q.set("period", params.period);
        if (params?.account_code) q.set("account_code", params.account_code);
        if (params?.page) q.set("page", String(params.page));
        return this.request<{ data: FinJournalEntry[]; meta: { total: number } }>(`/admin/finance/ledger/journal-entries?${q}`);
    }
    async getChartOfAccounts(): Promise<FinChartOfAccount[]> {
        const res = await this.request<{ success: boolean; data: FinChartOfAccount[] }>("/admin/finance/ledger/chart-of-accounts");
        return res.data;
    }
    async getTrialBalance(asOf?: string): Promise<FinTrialBalance> {
        const q = asOf ? `?as_of=${asOf}` : "";
        const res = await this.request<{ success: boolean; data: FinTrialBalance }>(`/admin/finance/ledger/trial-balance${q}`);
        return res.data;
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────
    async getKPIs(period: "month" | "quarter" | "year" = "month"): Promise<FinKPIs> {
        const res = await this.request<{ success: boolean; data: FinKPIs }>(`/admin/finance/kpis?period=${period}`);
        return res.data;
    }

    // ── Audit ─────────────────────────────────────────────────────────────────
    async listAuditEntries(params?: { module?: string; action?: string; from?: string; page?: number }): Promise<{ data: FinAuditEntry[]; meta: { total: number } }> {
        const q = new URLSearchParams();
        if (params?.module) q.set("module", params.module);
        if (params?.action) q.set("action", params.action);
        if (params?.from) q.set("from", params.from);
        if (params?.page) q.set("page", String(params.page));
        return this.request<{ data: FinAuditEntry[]; meta: { total: number } }>(`/admin/finance/audit?${q}`);
    }

    // ── Budgets ───────────────────────────────────────────────────────────────
    async listBudgets(year?: number): Promise<FinBudget[]> {
        const q = year ? `?year=${year}` : "";
        const res = await this.request<{ success: boolean; data: FinBudget[] }>(`/admin/finance/budgets${q}`);
        return res.data;
    }
    async upsertBudget(data: { category: string; year: number; monthly_budget: number }): Promise<FinBudget> {
        const res = await this.request<{ success: boolean; data: FinBudget }>("/admin/finance/budgets", { method: "POST", body: JSON.stringify(data) });
        return res.data;
    }

    // ── Cash Flow ─────────────────────────────────────────────────────────────
    async getCashFlowSummary(period: "weekly" | "monthly" | "quarterly" = "monthly"): Promise<FinCashFlowSummary> {
        const res = await this.request<{ success: boolean; data: FinCashFlowSummary }>(`/admin/finance/cashflow/summary?period=${period}`);
        return res.data;
    }
    async getCashFlowTrend(): Promise<FinCashFlowTrendPoint[]> {
        const res = await this.request<{ success: boolean; data: FinCashFlowTrendPoint[] }>("/admin/finance/cashflow/trend");
        return res.data;
    }

    // ── Reports ───────────────────────────────────────────────────────────────
    async getIncomeStatement(from: string, to: string): Promise<FinIncomeStatement> {
        const res = await this.request<{ success: boolean; data: FinIncomeStatement }>(`/admin/finance/reports/income-statement?from=${from}&to=${to}`);
        return res.data;
    }
    async getBalanceSheet(asOf: string): Promise<FinBalanceSheet> {
        const res = await this.request<{ success: boolean; data: FinBalanceSheet }>(`/admin/finance/reports/balance-sheet?as_of=${asOf}`);
        return res.data;
    }
    async exportReport(data: { report_type: string; format: "pdf" | "excel" | "csv"; from?: string; to?: string }): Promise<{ download_url: string; expires_at: string }> {
        const res = await this.request<{ success: boolean; data: { download_url: string; expires_at: string } }>("/admin/finance/reports/export", { method: "POST", body: JSON.stringify(data) });
        return res.data;
    }
}

export const financeApi = new FinanceApiService();

export type {
    EmailItem,
    EmailListResponse,
    EmailDetailResponse,
    ComposeEmailData,
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
    BillingInvoice,
    BillingConfig,
    BillingConfigPatch,
    FinRevenueSummary,
    FinRevenueSummaryPeriod,
    FinRevenueTrendPoint,
    FinRevenueBySource,
    FinRevenueSource,
    FinRevenueEntry,
    FinExpense,
    FinExpenseSummary,
    FinOwnerDraw,
    FinOwnerDrawSummary,
    FinCompanyAccount,
    FinAccountTransaction,
    FinAccountPosition,
    FinJournalEntry,
    FinJournalEntryLine,
    FinChartOfAccount,
    FinTrialBalance,
    FinKPIs,
    FinAuditEntry,
    FinBudget,
    FinCashFlowSummary,
    FinCashFlowTrendPoint,
    FinIncomeStatement,
    FinBalanceSheet,
};
