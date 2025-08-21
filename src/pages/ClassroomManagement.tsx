import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Settings } from "lucide-react";
import { Classroom, Profile } from "@/types/database";

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (selectedClassroom) {
      fetchStudents();
    }
  }, [selectedClassroom]);

  const fetchClassrooms = async () => {
    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke hente klasserom",
        variant: "destructive",
      });
    } else {
      setClassrooms(data || []);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("classroom_id", selectedClassroom)
      .eq("role", "learner")
      .order("name");

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke hente elever",
        variant: "destructive",
      });
    } else {
      setStudents(data || []);
    }
  };

  const createClassroom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const { error } = await supabase
      .from("classrooms")
      .insert({ name });

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette klasserom",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Suksess",
        description: "Klasserom opprettet!",
      });
      setShowCreateForm(false);
      fetchClassrooms();
    }

    setLoading(false);
  };

  const updateStudentLevel = async (studentId: string, newLevel: number) => {
    const { error } = await supabase
      .from("profiles")
      .update({ difficulty_level: newLevel })
      .eq("id", studentId);

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere nivå",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Oppdatert",
        description: "Elevens nivå er oppdatert",
      });
      fetchStudents();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/teacher")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til dashboard
            </Button>
            <h1 className="text-3xl font-bold">Klasserom</h1>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Opprett klasserom
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Opprett nytt klasserom</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createClassroom} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="name">Klasserom navn</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="f.eks. 5A, Nybegynner norsk"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Oppretter..." : "Opprett"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Avbryt
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Velg klasserom
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classrooms.map((classroom) => (
                  <Button
                    key={classroom.id}
                    variant={selectedClassroom === classroom.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedClassroom(classroom.id)}
                  >
                    {classroom.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Elever i klasserom
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClassroom ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Navn</TableHead>
                        <TableHead>E-post</TableHead>
                        <TableHead>Morsmål</TableHead>
                        <TableHead>Nivå</TableHead>
                        <TableHead>Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.l1 || "Ikke angitt"}</TableCell>
                          <TableCell>
                            <Select
                              value={student.difficulty_level.toString()}
                              onValueChange={(value) => 
                                updateStudentLevel(student.id, parseInt(value))
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Se statistikk
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {students.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Ingen elever i dette klasserommet ennå
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Velg et klasserom for å se elever
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClassroomManagement;