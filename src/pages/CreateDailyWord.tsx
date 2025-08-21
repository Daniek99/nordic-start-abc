import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Profile } from "@/types/database";

const CreateDailyWord = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(data);
      }
    };
    getProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile?.classroom_id) return;
    
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const norwegian = formData.get("norwegian") as string;
    const theme = formData.get("theme") as string;
    const date = formData.get("date") as string;

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from("daily_words")
      .insert({
        norwegian,
        theme: theme || null,
        date,
        classroom_id: profile.classroom_id,
        created_by: session?.user.id,
        approved: false
      });

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette daglig ord",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Suksess",
        description: "Daglig ord opprettet!",
      });
      navigate("/teacher");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/teacher")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til dashboard
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Opprett daglig ord</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="norwegian">Norsk ord</Label>
                <Input
                  id="norwegian"
                  name="norwegian"
                  required
                  placeholder="Skriv det norske ordet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Tema (valgfritt)</Label>
                <Input
                  id="theme"
                  name="theme"
                  placeholder="f.eks. dyr, mat, transport"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Dato</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Oppretter..." : "Opprett daglig ord"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateDailyWord;