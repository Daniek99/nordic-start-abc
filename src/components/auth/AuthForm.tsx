import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const AuthForm = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTeacherLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Feil ved innlogging",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Innlogget",
        description: "Velkommen tilbake!",
      });
    }

    setLoading(false);
  };

  const handleLearnerLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const inviteCode = formData.get("inviteCode") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const l1 = formData.get("l1") as string;

    try {
      // Get invite role first
      const { data: roleData, error: roleError } = await supabase.rpc('get_invite_role', { code: inviteCode });
      
      if (roleError) throw roleError;

      // Sign up user without password (using invite code as temporary password)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: inviteCode + "_temp", // Temporary password
      });

      if (authError) throw authError;

      if (authData.user) {
        // Register with invite
        const { error: registerError } = await supabase.rpc('register_with_invite', {
          code: inviteCode,
          name,
          l1_code: l1,
          want_role: roleData
        });

        if (registerError) throw registerError;

        toast({
          title: "Registrert",
          description: "Du er nå registrert og logget inn!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Feil ved registrering",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Norgeskole Hjelper</CardTitle>
          <CardDescription className="text-center">
            Logg inn eller registrer deg
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teacher" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teacher">Lærer</TabsTrigger>
              <TabsTrigger value="learner">Elev</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teacher">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-email">E-post</Label>
                  <Input
                    id="teacher-email"
                    name="email"
                    type="email"
                    required
                    placeholder="din@epost.no"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-password">Passord</Label>
                  <Input
                    id="teacher-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Ditt passord"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logger inn..." : "Logg inn som lærer"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="learner">
              <form onSubmit={handleLearnerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="learner-invite">Invitasjonskode</Label>
                  <Input
                    id="learner-invite"
                    name="inviteCode"
                    required
                    placeholder="ABC123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learner-name">Navn</Label>
                  <Input
                    id="learner-name"
                    name="name"
                    required
                    placeholder="Ditt navn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learner-email">E-post</Label>
                  <Input
                    id="learner-email"
                    name="email"
                    type="email"
                    required
                    placeholder="din@epost.no"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learner-l1">Morsmål</Label>
                  <Input
                    id="learner-l1"
                    name="l1"
                    placeholder="f.eks. somali, polsk, arabisk"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrerer..." : "Registrer deg som elev"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};