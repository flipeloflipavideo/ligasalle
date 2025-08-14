"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Users, 
  ArrowLeft, 
  Settings, 
  Trophy,
  Calendar,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface League {
  id: string;
  name: string;
  description?: string;
  sportType: string;
  ageCategory: string;
  maxTeams?: number;
  isActive: boolean;
  season: {
    id: string;
    name: string;
  };
  _count: {
    teams: number;
    matches: number;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  coachName?: string;
  color?: string;
  isActive: boolean;
  _count: {
    players: number;
  };
}

export default function LeagueTeamsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coachName: "",
    color: "#3B82F6",
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchTeams(selectedLeague.id);
    }
  }, [selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues");
      if (response.ok) {
        const data = await response.json();
        setLeagues(data);
        
        // Auto-select the first active league
        const activeLeague = data.find((league: League) => league.isActive);
        if (activeLeague) {
          setSelectedLeague(activeLeague);
        }
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async (leagueId: string) => {
    try {
      const response = await fetch(`/api/teams?leagueId=${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeague) return;
    
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          leagueId: selectedLeague.id,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          coachName: "",
          color: "#3B82F6",
        });
        fetchTeams(selectedLeague.id);
      } else {
        const error = await response.json();
        alert(error.error || "Error creating team");
      }
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      coachName: team.coachName || "",
      color: team.color || "#3B82F6",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTeam || !selectedLeague) return;
    
    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          leagueId: selectedLeague.id,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingTeam(null);
        setFormData({
          name: "",
          description: "",
          coachName: "",
          color: "#3B82F6",
        });
        fetchTeams(selectedLeague.id);
      } else {
        const error = await response.json();
        alert(error.error || "Error updating team");
      }
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este equipo? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (selectedLeague) {
          fetchTeams(selectedLeague.id);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Error deleting team");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const getSportIcon = (sportType: string) => {
    return sportType === "FOOTBALL" ? "⚽" : "🏀";
  };

  const getAgeCategoryLabel = (category: string) => {
    switch (category) {
      case "GRADE_1_2":
        return "1°-2° Grado";
      case "GRADE_3_4":
        return "3°-4° Grado";
      case "GRADE_5_6":
        return "5°-6° Grado";
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/seasons">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Temporadas
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipos</h1>
            <p className="text-muted-foreground">
              Administra los equipos por liga
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* League Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar Liga</CardTitle>
              <CardDescription>
                Elige una liga para gestionar sus equipos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leagues.length > 0 ? (
                leagues.map((league) => (
                  <div
                    key={league.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedLeague?.id === league.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedLeague(league)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSportIcon(league.sportType)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{league.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getAgeCategoryLabel(league.ageCategory)}
                        </div>
                      </div>
                      {league.isActive && (
                        <Badge variant="default" className="text-xs">Activa</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {league._count.teams}/{league.maxTeams || "∞"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {league._count.matches}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay ligas disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teams Management */}
        <div className="lg:col-span-3">
          {selectedLeague ? (
            <>
              {/* League Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSportIcon(selectedLeague.sportType)}</span>
                        <div>
                          <CardTitle>{selectedLeague.name}</CardTitle>
                          <CardDescription>
                            {getAgeCategoryLabel(selectedLeague.ageCategory)} • {selectedLeague.season.name}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedLeague.isActive ? "default" : "secondary"}>
                        {selectedLeague.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                      <Badge variant="outline">
                        {selectedLeague.sportType === "FOOTBALL" ? "Fútbol" : "Baloncesto"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">{selectedLeague._count.teams}</div>
                        <div className="text-sm text-muted-foreground">Equipos</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">
                          {teams.reduce((acc, team) => acc + team._count.players, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Jugadores</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">{selectedLeague._count.matches}</div>
                        <div className="text-sm text-muted-foreground">Partidos</div>
                      </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Nuevo Equipo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Crear Nuevo Equipo</DialogTitle>
                          <DialogDescription>
                            Añade un nuevo equipo a la liga {selectedLeague.name}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Nombre del Equipo</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Ej: Tigres Rojos"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="coachName">Nombre del Entrenador</Label>
                            <Input
                              id="coachName"
                              value={formData.coachName}
                              onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                              placeholder="Ej: Carlos Pérez"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Descripción del equipo..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="color">Color Representativo</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="color"
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-16 h-10 p-1"
                              />
                              <Input
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                placeholder="#3B82F6"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit">Crear Equipo</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Editar Equipo</DialogTitle>
                          <DialogDescription>
                            Modifica la información del equipo
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Nombre del Equipo</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Ej: Tigres Rojos"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-coachName">Nombre del Entrenador</Label>
                            <Input
                              id="edit-coachName"
                              value={formData.coachName}
                              onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                              placeholder="Ej: Carlos Pérez"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Descripción</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Descripción del equipo..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-color">Color Representativo</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="edit-color"
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-16 h-10 p-1"
                              />
                              <Input
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                placeholder="#3B82F6"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit">Actualizar Equipo</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Teams List */}
              <div className="grid gap-4">
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <Card key={team.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {team.color && (
                              <div
                                className="w-12 h-12 rounded-full border-2 border-border"
                                style={{ backgroundColor: team.color }}
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold">{team.name}</h3>
                              {team.coachName && (
                                <p className="text-sm text-muted-foreground">Entrenador: {team.coachName}</p>
                              )}
                              {team.description && (
                                <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold">{team._count.players}</div>
                              <div className="text-sm text-muted-foreground">jugadores</div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/team-players/${team.id}`}>
                                <Button variant="outline" size="sm">
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Jugadores
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(team.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Users className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay equipos</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Añade equipos a esta liga para comenzar a gestionar los jugadores
                      </p>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primer Equipo
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona una liga</h3>
                <p className="text-muted-foreground text-center">
                  Elige una liga de la lista para comenzar a gestionar sus equipos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}