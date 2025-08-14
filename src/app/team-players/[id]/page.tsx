"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Calendar,
  Edit,
  Trash2,
  User
} from "lucide-react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  description?: string;
  coachName?: string;
  color?: string;
  league: {
    id: string;
    name: string;
    sportType: string;
    ageCategory: string;
  };
}

interface Player {
  id: string;
  name: string;
  isActive: boolean;
  annotations?: string;
}

export default function TeamPlayersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    annotations: "",
  });

  useEffect(() => {
    if (teamId) {
      fetchTeam();
      fetchPlayers();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPlayer ? `/api/players/${editingPlayer.id}` : "/api/players";
      const method = editingPlayer ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          teamId,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchPlayers();
      } else {
        const error = await response.json();
        alert(error.error || "Error al guardar jugador");
      }
    } catch (error) {
      console.error("Error saving player:", error);
      alert("Error al guardar jugador");
    }
  };

  const handleDelete = async (playerId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este jugador?")) {
      return;
    }

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPlayers();
      } else {
        const error = await response.json();
        alert(error.error || "Error al eliminar jugador");
      }
    } catch (error) {
      console.error("Error deleting player:", error);
      alert("Error al eliminar jugador");
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      annotations: player.annotations || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPlayer(null);
    setFormData({
      name: "",
      annotations: "",
    });
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

  const calculateAge = (birthDate: string) => {
    // Esta función ya no se necesita pero la dejamos por si acaso
    return "N/A";
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

  if (!team) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Equipo no encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              El equipo que buscas no existe o ha sido eliminado
            </p>
            <Link href="/league-teams">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Equipos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/league-teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Equipos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jugadores del Equipo</h1>
            <p className="text-muted-foreground">
              Administra los jugadores del equipo
            </p>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {team.color && (
                <div
                  className="w-16 h-16 rounded-full border-2 border-border"
                  style={{ backgroundColor: team.color }}
                />
              )}
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <CardDescription>
                  {team.league.name} • {getAgeCategoryLabel(team.league.ageCategory)}
                </CardDescription>
                {team.coachName && (
                  <p className="text-sm text-muted-foreground mt-1">Entrenador: {team.coachName}</p>
                )}
                {team.description && (
                  <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                )}
              </div>
            </div>
            <Badge variant="outline">
              {team.league.sportType === "FOOTBALL" ? "Fútbol" : "Baloncesto"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{players.length}</div>
                <div className="text-sm text-muted-foreground">Jugadores</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {players.filter(p => p.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Activos</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {players.filter(p => !p.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Inactivos</div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Jugador
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlayer ? "Editar Jugador" : "Añadir Nuevo Jugador"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlayer 
                      ? "Modifica los datos del jugador existente"
                      : `Registra un nuevo jugador en el equipo ${team.name}`
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre del Jugador</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre completo del jugador"
                      required
                    />
                  </div>
                  <input
                    type="hidden"
                    name="annotations"
                    value={formData.annotations}
                    onChange={(e) => setFormData({ ...formData, annotations: e.target.value })}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingPlayer ? "Actualizar Jugador" : "Añadir Jugador"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <div className="grid gap-4">
        {players.length > 0 ? (
          players.map((player) => (
            <Card key={player.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {player.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Jugador activo</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={player.isActive ? "default" : "secondary"}>
                      {player.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(player)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(player.id)}
                      >
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
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay jugadores</h3>
              <p className="text-muted-foreground text-center mb-4">
                Añade jugadores a este equipo para completar la plantilla
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Primer Jugador
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}