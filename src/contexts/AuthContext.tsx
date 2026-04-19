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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Handle session expiration
    const handleSessionExpired = () => {
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        // Show toast notification
        toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
        });
    };

    useEffect(() => {
        // Set up the unauthorized handler
        api.setUnauthorizedHandler(handleSessionExpired);

        // Set up rate limit handler
        api.setRateLimitHandler((retryAfterSeconds: number) => {
            toast({
                title: "Rate Limit Reached",
                description: `Too many requests. Retrying in ${retryAfterSeconds} seconds…`,
                variant: "destructive",
            });
        });

        const checkAuth = async () => {
            if (api.isAuthenticated()) {
                try {
                    const response = await api.getProfile();
                    if (response.success) {
                        setUser(response.data);
                    }
                } catch (error) {
                    // Error already handled by unauthorized handler
                    console.error("Auth check failed:", error);
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

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
