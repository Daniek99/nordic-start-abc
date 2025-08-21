import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Users, BookOpen, Link, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [inviteData, setInviteData] = useState({
    role: "",
    classroom_id: "",
  });
  const [classrooms, setClassrooms] = useState([]);
  const [inviteLinks, setInviteLinks] = useState([]);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load classrooms
      const { data: classroomData, error: classroomError } = await supabase
        .from("classrooms")
        .select("*")
        .order("name");

      if (classroomError) {
        console.error("Error loading classrooms:", classroomError);
      } else {
        setClassrooms(classroomData || []);
      }

      // Load invite links
      const { data: inviteData, error: inviteError } = await supabase
        .from("admin_invite_links")
        .select(`
          *,
          classrooms(name)
        `)
        .order("created_at", { ascending: false });

      if (inviteError) {
        console.error("Error loading invite links:", inviteError);
      } else {
        setInviteLinks(inviteData || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const createInviteLink = async () => {
    if (!inviteData.role || !inviteData.classroom_id) {
      toast({
        title: "Feil",
        description: "Velg rolle og klasserom",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingInvite(true);

    try {
      const code = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from("admin_invite_links")
        .insert({
          code,
          role: inviteData.role,
          classroom_id: inviteData.classroom_id,
          active: true,
        });

      if (error) {
        console.error("Error creating invite link:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke opprette invitasjonslenke",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Suksess",
        description: "Invitasjonslenke opprettet",
      });

      setInviteData({ role: "", classroom_id: "" });
      loadData();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Feil",
        description: "Noe gikk galt",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const toggleInviteLink = async (linkId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("admin_invite_links")
        .update({ active: !active })
        .eq("id", linkId);

      if (error) {
        console.error("Error toggling invite link:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke oppdatere invitasjonslenke",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Suksess",
        description: active ? "Invitasjonslenke deaktivert" : "Invitasjonslenke aktivert",
      });

      loadData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Administrator Dashboard</h1>
          <p className="text-muted-foreground">Administrer plattformen og brukere</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale klasserom</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classrooms.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive invitasjoner</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inviteLinks.filter(link => link.active).length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daglige ord</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">På tvers av klasserom</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Systemstatus</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-xs text-muted-foreground">Alt fungerer</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Opprett invitasjonslenke
              </CardTitle>
              <CardDescription>
                Generer en lenke for å invitere nye brukere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg rolle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="teacher">Lærer</SelectItem>
                    <SelectItem value="learner">Elev</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classroom">Klasserom</Label>
                <Select
                  value={inviteData.classroom_id}
                  onValueChange={(value) => setInviteData(prev => ({ ...prev, classroom_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg klasserom" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={createInviteLink} 
                disabled={isCreatingInvite}
                className="w-full"
              >
                {isCreatingInvite ? "Oppretter..." : "Opprett invitasjonslenke"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Invitasjonslenker</CardTitle>
              <CardDescription>
                Administrer eksisterende invitasjonslenker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inviteLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ingen invitasjonslenker opprettet ennå
                  </p>
                ) : (
                  inviteLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{link.role}</p>
                        <p className="text-sm text-muted-foreground">
                          {link.classrooms?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          /invite/{link.code}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={link.active ? "destructive" : "secondary"}
                        onClick={() => toggleInviteLink(link.id, link.active)}
                      >
                        {link.active ? "Deaktiver" : "Aktiver"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;