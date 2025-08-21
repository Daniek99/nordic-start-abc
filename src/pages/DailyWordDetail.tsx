import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Mic, Volume2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

const DailyWordDetail = () => {
  const { dailyWordId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dailyWord, setDailyWord] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (dailyWordId) {
      loadDailyWord();
    }
  }, [dailyWordId]);

  const loadDailyWord = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserProfile(profile);

      // Load daily word with all related data
      const { data: wordData, error } = await supabase
        .from("daily_words")
        .select(`
          *,
          level_texts(*),
          translations(*),
          pronunciations(*),
          tasks(*)
        `)
        .eq("id", dailyWordId)
        .single();

      if (error) {
        console.error("Error loading daily word:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste daglig ord",
          variant: "destructive",
        });
        return;
      }

      setDailyWord(wordData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playPronunciation = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error("Error playing audio:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke spille av lyd",
        variant: "destructive",
      });
    });
  };

  const getTranslationForUser = () => {
    if (!dailyWord?.translations || !userProfile?.l1) return null;
    return dailyWord.translations.find(t => t.language_code === userProfile.l1);
  };

  const getLevelText = () => {
    if (!dailyWord?.level_texts || !userProfile?.difficulty_level) return null;
    return dailyWord.level_texts.find(lt => lt.level === userProfile.difficulty_level);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dailyWord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Ord ikke funnet</h3>
            <p className="text-muted-foreground mb-4">
              Det daglige ordet kunne ikke lastes.
            </p>
            <Button onClick={() => navigate(-1)}>
              Gå tilbake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const translation = getTranslationForUser();
  const levelText = getLevelText();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{dailyWord.norwegian}</h1>
              <p className="text-muted-foreground">
                {new Date(dailyWord.date).toLocaleDateString("no-NO")}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Ordet i dag</CardTitle>
                {dailyWord.theme && (
                  <Badge variant="outline" className="w-fit">
                    {dailyWord.theme}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {dailyWord.image_url && (
                  <img
                    src={dailyWord.image_url}
                    alt={dailyWord.image_alt || dailyWord.norwegian}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-primary mb-2">
                    {dailyWord.norwegian}
                  </h2>
                  {translation && (
                    <p className="text-xl text-muted-foreground">
                      {translation.text}
                    </p>
                  )}
                </div>

                {dailyWord.pronunciations?.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {dailyWord.pronunciations.map((pronunciation, index) => (
                      <Button
                        key={pronunciation.id}
                        variant="secondary"
                        size="sm"
                        onClick={() => playPronunciation(pronunciation.audio_url)}
                        className="flex items-center gap-2"
                      >
                        <Volume2 className="h-4 w-4" />
                        Uttale {pronunciation.language_code.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {levelText && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Tekst for ditt nivå</CardTitle>
                  <CardDescription>
                    Nivå {levelText.level} tekst
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {levelText.image_url && (
                    <img
                      src={levelText.image_url}
                      alt={levelText.image_alt || "Nivå tekst illustrasjon"}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <p className="text-sm leading-relaxed">
                    {levelText.text}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {dailyWord.tasks?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Oppgaver</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {dailyWord.tasks.map((task, index) => (
                  <Card key={task.id} className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Oppgave {index + 1}
                      </CardTitle>
                      <CardDescription>
                        Type: {task.type} | Nivå: {task.level}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{task.prompt}</p>
                      <Button size="sm" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Start oppgave
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card className="shadow-soft mt-8">
            <CardHeader>
              <CardTitle>Øvelser</CardTitle>
              <CardDescription>
                Øv på uttale og test forståelsen din
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Øv på uttale
              </Button>
              <Button variant="secondary" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Ta quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DailyWordDetail;