import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  role?: "admin" | "teacher" | "learner";
}

export const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Get user profile to check role
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          toast({
            title: "Feil",
            description: "Kunne ikke hente brukerprofil",
            variant: "destructive",
          });
          setIsAuthenticated(false);
        } else {
          setUserRole(profile?.role || null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUserRole(null);
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role && userRole !== role) {
    toast({
      title: "Ingen tilgang",
      description: "Du har ikke tilgang til denne siden",
      variant: "destructive",
    });
    
    // Redirect based on user role
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userRole === "teacher") {
      return <Navigate to="/teacher" replace />;
    } else if (userRole === "learner") {
      return <Navigate to="/elev" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};