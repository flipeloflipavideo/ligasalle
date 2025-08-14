"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Trophy, 
  Calendar,
  Users,
  Search
} from "lucide-react";
import { League, Season, SportType, AgeCategory } from "@prisma/client";

interface LeagueWithDetails extends League {
  season: Season;
  _count: {
    teams: number;
    matches: number;
  };
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueWithDetails[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<LeagueWithDetails | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sportType: "" as SportType,
    ageCategory: "" as AgeCategory,
    seasonId: "",
    maxTeams: "",
    isActive: true,
  });

  useEffect(() => {
    fetchLeagues();
    fetchSeasons();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues");
      if (response.ok) {
        const data = await response.json();
        setLeagues(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ligas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await fetch("/api/seasons");
      if (response.ok) {
        const data = await response.json();
        setSeasons(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las temporadas",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLeague ? `/api/leagues/${editingLeague.id}` : "/api/leagues";
      const method = editingLeague ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingLeague ? "Liga actualizada correctamente" : "Liga creada correctamente",
        });
        fetchLeagues();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo guardar la liga",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la liga",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/leagues/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Liga eliminada correctamente",
        });
        fetchLeagues();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo eliminar la liga",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la liga",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (league: LeagueWithDetails) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      description: league.description || "",
      sportType: league.sportType,
      ageCategory: league.ageCategory,
      seasonId: league.seasonId,
      maxTeams: league.maxTeams?.toString() || "",
      isActive: league.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLeague(null);
    setFormData({
      name: "",
      description: "",
      sportType: "" as SportType,
      ageCategory: "" as AgeCategory,
      seasonId: "",
      maxTeams: "",
      isActive: true,
    });
  };

  const filteredLeagues = leagues.filter(league =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSportIcon = (sportType: SportType) => {
    return sportType === SportType.FOOTBALL ? (
      <span className="text-lg">⚽</span>
    ) : (
      <span className="text-lg">🏀</span>
    );
  };

  const getAgeCategoryLabel = (category: AgeCategory) => {
    switch (category) {
      case AgeCategory.GRADE_1_2:
        return "1°-2° Grado";
      case AgeCategory.GRADE_3_4:
        return "3°-4° Grado";
      case AgeCategory.GRADE_5_6:
        return "5°-6° Grado";
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ligas</h1>
          <p className="text-muted-foreground">
            Gestiona las ligas deportivas del sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Liga
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingLeague ? "Editar Liga" : "Crear Nueva Liga"}
                </DialogTitle>
                <DialogDescription>
                  {editingLeague 
                    ? "Modifica los datos de la liga existente"
                    : "Completa los datos para crear una nueva liga"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sportType" className="text-right">
                    Deporte *
                  </Label>
                  <Select
                    value={formData.sportType}
                    onValueChange={(value) => setFormData({ ...formData, sportType: value as SportType })}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un deporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SportType.FOOTBALL}>Fútbol</SelectItem>
                      <SelectItem value={SportType.BASKETBALL}>Baloncesto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ageCategory" className="text-right">
                    Categoría *
                  </Label>
                  <Select
                    value={formData.ageCategory}
                    onValueChange={(value) => setFormData({ ...formData, ageCategory: value as AgeCategory })}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AgeCategory.GRADE_1_2}>1°-2° Grado</SelectItem>
                      <SelectItem value={AgeCategory.GRADE_3_4}>3°-4° Grado</SelectItem>
                      <SelectItem value={AgeCategory.GRADE_5_6}>5°-6° Grado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="seasonId" className="text-right">
                    Temporada *
                  </Label>
                  <Select
                    value={formData.seasonId}
                    onValueChange={(value) => setFormData({ ...formData, seasonId: value })}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una temporada" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxTeams" className="text-right">
                    Máx. Equipos
                  </Label>
                  <Input
                    id="maxTeams"
                    type="number"
                    min="1"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: e.target.value })}
                    className="col-span-3"
                    placeholder="Sin límite"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Activa
                  </Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingLeague ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ligas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagues.length}</div>
            <p className="text-xs text-muted-foreground">
              {leagues.filter(l => l.isActive).length} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seasons.length}</div>
            <p className="text-xs text-muted-foreground">
              {seasons.filter(s => s.isActive).length} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leagues.reduce((acc, league) => acc + league._count.teams, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas las ligas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partidos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leagues.reduce((acc, league) => acc + league._count.matches, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Programados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ligas</CardTitle>
          <CardDescription>
            Todas las ligas deportivas registradas en el sistema
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ligas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Temporada</TableHead>
                <TableHead>Equipos</TableHead>
                <TableHead>Partidos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeagues.map((league) => (
                <TableRow key={league.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{league.name}</div>
                      {league.description && (
                        <div className="text-sm text-muted-foreground">
                          {league.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSportIcon(league.sportType)}
                      <span className="capitalize">
                        {league.sportType === SportType.FOOTBALL ? "Fútbol" : "Baloncesto"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getAgeCategoryLabel(league.ageCategory)}
                  </TableCell>
                  <TableCell>{league.season.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{league._count.teams}</span>
                      {league.maxTeams && (
                        <span className="text-muted-foreground">
                          /{league.maxTeams}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{league._count.matches}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={league.isActive ? "default" : "secondary"}>
                      {league.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(league)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar Liga?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. La liga será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(league.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLeagues.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron ligas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}