import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Mic, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const LearnerHome = () => {
  const [dailyWords, setDailyWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      if (profileData?.classroom_id) {
        // Load daily words for the classroom
        const { data: wordsData, error } = await supabase
          .from("daily_words")
          .select(`
            *,
            level_texts(*),
            translations(*),
            pronunciations(*)
          `)
          .eq("classroom_id", profileData.classroom_id)
          .order("date", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error loading daily words:", error);
          toast({
            title: "Feil",
            description: "Kunne ikke laste daglige ord",
            variant: "destructive",
          });
        } else {
          setDailyWords(wordsData || []);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hei, {profile?.name || "Elev"}! 👋
          </h1>
          <p className="text-muted-foreground">Klar for å lære norsk i dag?</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Daglige ord</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/elev/profile")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Min profil
          </Button>
        </div>

        {dailyWords.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen ord tilgjengelig</h3>
              <p className="text-muted-foreground">
                Din lærer har ikke lagt til noen daglige ord ennå.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyWords.map((word) => (
              <Card key={word.id} className="shadow-soft hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{word.norwegian}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(word.date).toLocaleDateString("no-NO")}
                      </CardDescription>
                    </div>
                    {word.approved && (
                      <Badge variant="secondary">Godkjent</Badge>
                    )}
                  </div>
                  {word.theme && (
                    <Badge variant="outline" className="w-fit mt-2">
                      {word.theme}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {word.image_url && (
                    <img
                      src={word.image_url}
                      alt={word.image_alt || word.norwegian}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/elev/daily-word/${word.id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Lær
                    </Button>
                    {word.pronunciations?.length > 0 && (
                      <Button size="sm" variant="outline">
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerHome;