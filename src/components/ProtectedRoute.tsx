import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className= "flex h-screen items-center justify-center" >
            <div className="flex flex-col items-center gap-4" >
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground" > Loading...</p>
                        </div>
                        </div>
    );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{ children } </>;
}
