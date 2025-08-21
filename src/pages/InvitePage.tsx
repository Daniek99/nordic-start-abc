import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const InvitePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [session, setSession] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    name: "",
    l1: "",
  });

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const validateInviteCode = async () => {
      if (!code) {
        toast({
          title: "Ugyldig invitasjonskode",
          description: "Invitasjonskoden mangler",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc("get_invite_role", { code });

        if (error) {
          console.error("Error validating invite code:", error);
          toast({
            title: "Ugyldig invitasjonskode",
            description: "Invitasjonskoden er ugyldig eller utløpt",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setInviteRole(data);
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke validere invitasjonskode",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsValidating(false);
      }
    };

    validateInviteCode();
  }, [code, toast, navigate]);

  const handleRegistration = async () => {
    if (!session || !code || !inviteRole) return;

    if (!registrationData.name.trim()) {
      toast({
        title: "Feil",
        description: "Vennligst fyll inn navn",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      const { error } = await supabase.rpc("register_with_invite", {
        code,
        name: registrationData.name,
        l1_code: registrationData.l1 || null,
        want_role: inviteRole,
      });

      if (error) {
        console.error("Registration error:", error);
        toast({
          title: "Registreringsfeil",
          description: error.message || "Kunne ikke registrere bruker",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Velkommen!",
        description: "Din konto er opprettet",
      });

      // Redirect based on role
      if (inviteRole === "admin") {
        navigate("/admin");
      } else if (inviteRole === "teacher") {
        navigate("/teacher");
      } else if (inviteRole === "learner") {
        navigate("/elev");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Feil",
        description: "Noe gikk galt under registrering",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Velkommen til Norgeskole</CardTitle>
          <CardDescription>
            {inviteRole === "teacher" ? "Lærer" : inviteRole === "learner" ? "Elev" : "Administrator"} invitasjon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Logg inn eller opprett en konto for å fortsette
              </p>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                theme="light"
                providers={[]}
                redirectTo={window.location.href}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fullt navn</Label>
                <Input
                  id="name"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Skriv ditt fulle navn"
                />
              </div>

              {inviteRole === "learner" && (
                <div className="space-y-2">
                  <Label htmlFor="l1">Morsmål (valgfritt)</Label>
                  <Select
                    value={registrationData.l1}
                    onValueChange={(value) => setRegistrationData(prev => ({ ...prev, l1: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg morsmål" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">Engelsk</SelectItem>
                      <SelectItem value="es">Spansk</SelectItem>
                      <SelectItem value="fr">Fransk</SelectItem>
                      <SelectItem value="de">Tysk</SelectItem>
                      <SelectItem value="pl">Polsk</SelectItem>
                      <SelectItem value="ar">Arabisk</SelectItem>
                      <SelectItem value="so">Somali</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={handleRegistration} 
                disabled={isRegistering}
                className="w-full"
              >
                {isRegistering ? "Registrerer..." : "Fullfør registrering"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;