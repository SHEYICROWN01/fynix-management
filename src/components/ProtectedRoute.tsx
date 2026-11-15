import { Navigate } from "react-router-dom";
import { useAuth, isTokenExpired } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Proactive expiry check — catches expired tokens the moment the user
    // navigates to any protected page, before a single API call fires.
    if (!isAuthenticated || isTokenExpired()) {
        if (isTokenExpired()) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
