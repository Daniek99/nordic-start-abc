import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Award, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        checkUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      setUserProfile(profile);

      // Redirect based on role if profile exists
      if (profile) {
        switch (profile.role) {
          case "admin":
            navigate("/admin");
            break;
          case "teacher":
            navigate("/teacher");
            break;
          case "learner":
            navigate("/elev");
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-foreground mb-6">
            Norge<span className="text-primary">skole</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            En interaktiv plattform for å lære norsk gjennom daglige ord, oppgaver og personalisert læring
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center shadow-soft">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Daglige ord</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Lær nye norske ord hver dag med bilder, lyd og interaktive oppgaver
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft">
            <CardHeader>
              <Users className="h-12 w-12 text-accent mx-auto mb-2" />
              <CardTitle>Klasserom</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Lærere kan administrere klasser og følge elevenes fremgang
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft">
            <CardHeader>
              <Award className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Personalisert</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tilpasset innhold basert på nivå og morsmål
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft">
            <CardHeader>
              <Globe className="h-12 w-12 text-accent mx-auto mb-2" />
              <CardTitle>Flerspråklig</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Støtte for flere morsmål og kulturer
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          {!session ? (
            <Card className="shadow-soft">
              <CardHeader className="text-center">
                <CardTitle>Kom i gang</CardTitle>
                <CardDescription>
                  Logg inn for å få tilgang til læringsplattformen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  theme="light"
                  providers={[]}
                />
              </CardContent>
            </Card>
          ) : !userProfile ? (
            <Card className="shadow-soft">
              <CardHeader className="text-center">
                <CardTitle>Velkommen!</CardTitle>
                <CardDescription>
                  Du trenger en invitasjonskode for å få tilgang
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Spør din lærer eller administrator om en invitasjonskode
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => supabase.auth.signOut()}
                >
                  Logg ut
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Index;
