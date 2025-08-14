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
  Users, 
  Search,
  Trophy,
  Palette,
  UserCheck,
  Eye,
  Shield
} from "lucide-react";
import { Team, League } from "@prisma/client";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

interface TeamWithDetails extends Team {
  league: League;
  _count: {
    players: number;
  };
}

interface LeagueOption {
  id: string;
  name: string;
  sportType: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithDetails | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leagueId: "",
    coachName: "",
    color: "#3b82f6",
    shieldUrl: "",
    isActive: true,
  });

  useEffect(() => {
    fetchTeams();
    fetchLeagues();
  }, [selectedLeague]);

  const fetchTeams = async () => {
    try {
      const url = selectedLeague 
        ? `/api/teams?leagueId=${selectedLeague}`
        : "/api/teams";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues");
      if (response.ok) {
        const data = await response.json();
        const activeLeagues = data
          .filter((league: any) => league.isActive)
          .map((league: any) => ({
            id: league.id,
            name: league.name,
            sportType: league.sportType,
          }));
        setLeagues(activeLeagues);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ligas",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingTeam ? "Equipo actualizado correctamente" : "Equipo creado correctamente",
        });
        fetchTeams();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo guardar el equipo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el equipo",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Equipo eliminado correctamente",
        });
        fetchTeams();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo eliminar el equipo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el equipo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (team: TeamWithDetails) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      leagueId: team.leagueId,
      coachName: team.coachName || "",
      color: team.color || "#3b82f6",
      shieldUrl: team.shieldUrl || "",
      isActive: team.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      description: "",
      leagueId: selectedLeague || "",
      coachName: "",
      color: "#3b82f6",
      shieldUrl: "",
      isActive: true,
    });
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, shieldUrl: url });
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, shieldUrl: "" });
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.coachName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSportIcon = (sportType: string) => {
    return sportType === "FOOTBALL" ? "⚽" : "🏀";
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
          <h1 className="text-3xl font-bold tracking-tight">Equipos por Categoría</h1>
          <p className="text-muted-foreground">
            Gestiona los equipos participantes organizados por deporte y categoría de edad
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? "Editar Equipo" : "Crear Nuevo Equipo"}
                </DialogTitle>
                <DialogDescription>
                  {editingTeam 
                    ? "Modifica los datos del equipo existente"
                    : "Completa los datos para crear un nuevo equipo"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Información básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Información Básica
                  </h3>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right font-medium">
                      Nombre *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                      required
                      placeholder="Ej: Tigres Rojos"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="col-span-3"
                      rows={2}
                      placeholder="Breve descripción del equipo..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="leagueId" className="text-right font-medium">
                      Liga *
                    </Label>
                    <Select
                      value={formData.leagueId}
                      onValueChange={(value) => setFormData({ ...formData, leagueId: value })}
                      required
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una liga" />
                      </SelectTrigger>
                      <SelectContent>
                        {leagues.map((league) => (
                          <SelectItem key={league.id} value={league.id}>
                            {getSportIcon(league.sportType)} {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sección de escudo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Escudo del Equipo
                  </h3>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-blue-800 font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      IMPORTANTE: Sube el escudo oficial del equipo aquí
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      El escudo se mostrará en las clasificaciones y listas de equipos.
                    </p>
                  </div>
                  
                  <ImageUpload
                    currentImage={formData.shieldUrl}
                    onImageUpload={handleImageUpload}
                    onImageRemove={handleImageRemove}
                    teamName={formData.name || "equipo"}
                  />
                </div>

                {/* Configuración adicional */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Configuración Adicional
                  </h3>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coachName" className="text-right font-medium">
                      Entrenador
                    </Label>
                    <Input
                      id="coachName"
                      value={formData.coachName}
                      onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                      className="col-span-3"
                      placeholder="Nombre del entrenador"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="color" className="text-right font-medium">
                      Color
                    </Label>
                    <div className="col-span-3 flex items-center gap-3">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1"
                        placeholder="#3b82f6"
                      />
                      <div 
                        className="w-8 h-8 rounded border-2 border-gray-300"
                        style={{ backgroundColor: formData.color }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right font-medium">
                      Estado
                    </Label>
                    <div className="col-span-3 flex items-center gap-3">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <span className="text-sm text-gray-600">
                        {formData.isActive ? "Equipo activo" : "Equipo inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTeam ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="leagueFilter">Filtrar por Liga</Label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ligas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las ligas</SelectItem>
                  {leagues.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {getSportIcon(league.sportType)} {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar equipos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTeams.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredTeams.filter(t => t.isActive).length} activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ligas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagues.length}</div>
            <p className="text-xs text-muted-foreground">
              Con equipos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jugadores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTeams.reduce((acc, team) => acc + team._count.players, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Jugadores registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Jugadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTeams.length > 0 
                ? Math.round(filteredTeams.reduce((acc, team) => acc + team._count.players, 0) / filteredTeams.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Por equipo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams by Category */}
      <div className="space-y-8">
        {(() => {
          // Group teams by sport type and age category
          const groupedTeams = filteredTeams.reduce((acc, team) => {
            const sportKey = team.league.sportType;
            const ageKey = team.league.ageCategory;
            
            if (!acc[sportKey]) {
              acc[sportKey] = {};
            }
            if (!acc[sportKey][ageKey]) {
              acc[sportKey][ageKey] = [];
            }
            acc[sportKey][ageKey].push(team);
            return acc;
          }, {} as Record<string, Record<string, typeof filteredTeams>>);

          const sportOrder = ["FOOTBALL", "BASKETBALL"];
          const ageOrder = ["GRADE_1_2", "GRADE_3_4", "GRADE_5_6"];

          return sportOrder.map(sportType => {
            if (!groupedTeams[sportType]) return null;
            
            return (
              <div key={sportType} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getSportIcon(sportType)}</span>
                  <h2 className="text-2xl font-bold">
                    {sportType === "FOOTBALL" ? "Fútbol" : "Baloncesto"}
                  </h2>
                </div>
                
                {ageOrder.map(ageCategory => {
                  const teamsInCategory = groupedTeams[sportType][ageCategory];
                  if (!teamsInCategory || teamsInCategory.length === 0) return null;
                  
                  return (
                    <Card key={ageCategory}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getAgeCategoryLabel(ageCategory)}
                          <Badge variant="outline">{teamsInCategory.length} equipos</Badge>
                        </CardTitle>
                        <CardDescription>
                          Equipos participantes en esta categoría
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {teamsInCategory.map((team) => (
                            <Card key={team.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  {/* Team Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      {team.shieldUrl ? (
                                        <img
                                          src={team.shieldUrl}
                                          alt={`Escudo de ${team.name}`}
                                          className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0 object-cover"
                                        />
                                      ) : team.color ? (
                                        <div
                                          className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                                          style={{ backgroundColor: team.color }}
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0 bg-gray-200 flex items-center justify-center">
                                          <Shield className="w-5 h-5 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">
                                          {team.name}
                                        </h3>
                                        {team.description && (
                                          <p className="text-sm text-muted-foreground line-clamp-2">
                                            {team.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <Badge variant={team.isActive ? "default" : "secondary"}>
                                      {team.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                  </div>
                                  
                                  {/* Team Info */}
                                  <div className="space-y-2 text-sm">
                                    {team.coachName && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <UserCheck className="w-4 h-4" />
                                        <span>Entrenador: {team.coachName}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Users className="w-4 h-4" />
                                      <span>{team._count.players} jugadores</span>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex gap-2 pt-2">
                                    <Link href={`/team-players/${team.id}`}>
                                      <Button variant="outline" size="sm" className="flex-1">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ver Jugadores
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(team)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar Equipo?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción no se puede deshacer. El equipo será eliminado permanentemente.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(team.id)}>
                                            Eliminar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron equipos</h3>
            <p className="text-muted-foreground text-center mb-4">
              {selectedLeague 
                ? "No hay equipos en esta liga. ¡Crea el primer equipo!"
                : "No hay equipos registrados. ¡Comienza creando un equipo!"
              }
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Equipo
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}