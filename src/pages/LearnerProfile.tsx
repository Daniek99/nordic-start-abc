import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, LogOut, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const LearnerProfile = () => {
  const [profile, setProfile] = useState({ 
    name: "", 
    email: "", 
    l1: "", 
    difficulty_level: 1 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("name, email, l1, difficulty_level")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste profil",
          variant: "destructive",
        });
        return;
      }

      setProfile({
        name: profileData?.name || "",
        email: profileData?.email || session.user.email || "",
        l1: profileData?.l1 || "",
        difficulty_level: profileData?.difficulty_level || 1,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast({
        title: "Feil",
        description: "Navn kan ikke være tomt",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({ 
          name: profile.name, 
          email: profile.email,
          l1: profile.l1 || null,
          difficulty_level: profile.difficulty_level
        })
        .eq("id", session.user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke oppdatere profil",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Suksess",
        description: "Profil oppdatert",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Feil",
        description: "Noe gikk galt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Min profil</h1>
            <p className="text-muted-foreground">Administrer dine læringsinnstillinger</p>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profilinformasjon
              </CardTitle>
              <CardDescription>
                Oppdater din personlige informasjon og læringsinnstillinger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fullt navn</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Skriv ditt fulle navn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="din@epost.no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="l1">Morsmål</Label>
                <Select
                  value={profile.l1}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, l1: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg morsmål" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ikke valgt</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="difficulty">Vanskelighetsgrad</Label>
                <Select
                  value={profile.difficulty_level.toString()}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, difficulty_level: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg nivå" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nivå 1 - Nybegynner</SelectItem>
                    <SelectItem value="2">Nivå 2 - Grunnleggende</SelectItem>
                    <SelectItem value="3">Nivå 3 - Middels</SelectItem>
                    <SelectItem value="4">Nivå 4 - Videregående</SelectItem>
                    <SelectItem value="5">Nivå 5 - Avansert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Lagrer..." : "Lagre endringer"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/elev")}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Hjem
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft mt-6">
            <CardHeader>
              <CardTitle className="text-destructive">Farlig sone</CardTitle>
              <CardDescription>
                Handlinger som påvirker kontoen din
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logg ut
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfile;