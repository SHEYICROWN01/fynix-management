import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    is_active: boolean;
    last_login_at: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Decode JWT expiry without a library. Returns ms timestamp or null. */
export function getTokenExpiryMs(): number | null {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return typeof payload.exp === "number" ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

/** True when the stored token is definitely expired. */
export function isTokenExpired(): boolean {
    if (!localStorage.getItem("access_token")) return true;
    const expMs = getTokenExpiryMs();
    if (expMs === null) return false; // no exp claim — assume still valid
    return Date.now() >= expMs;
}

/** Wipe auth storage and hard-navigate to login. Safe to call from outside React. */
function redirectToLogin() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    // Use location.replace so the protected page is NOT in the back-history.
    window.location.replace("/");
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Handle session expiration — called by the API client on any 401 response.
    const handleSessionExpired = () => {
        setUser(null);
        redirectToLogin();
    };

    useEffect(() => {
        // Wire API-level 401 → login redirect.
        api.setUnauthorizedHandler(handleSessionExpired);

        // Rate-limit toast.
        api.setRateLimitHandler((retryAfterSeconds: number) => {
            toast({
                title: "Rate Limit Reached",
                description: `Too many requests. Retrying in ${retryAfterSeconds} seconds…`,
                variant: "destructive",
            });
        });

        const checkAuth = async () => {
            if (api.isAuthenticated()) {
                // If the token is already stale on load, clear it and fall through —
                // ProtectedRoute's <Navigate> handles the redirect (no hard reload needed).
                if (isTokenExpired()) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    setIsLoading(false);
                    return;
                }
                try {
                    const response = await api.getProfile();
                    if (response.success) {
                        setUser(response.data);
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                }
            }
            setIsLoading(false);
        };

        checkAuth();

        // Poll every 60 s — if the token silently expired while the tab sat idle,
        // do a hard redirect so the user doesn't stay on a stale screen.
        const expiryPoll = setInterval(() => {
            if (localStorage.getItem("access_token") && isTokenExpired()) {
                redirectToLogin();
            }
        }, 60_000);

        return () => clearInterval(expiryPoll);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (email: string, password: string) => {
        const response = await api.login({ email, password });
        if (response.success) {
            setUser(response.data.user);
        }
    };

    const logout = async () => {
        try {
            await api.logout();
        } finally {
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            const response = await api.getProfile();
            if (response.success) {
                setUser(response.data);
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={ value }> { children } </AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
