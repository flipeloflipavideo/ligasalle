"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  MapPin,
  Trophy,
  Target,
  Users
} from "lucide-react";
import { MatchWithDetails } from "@/types";

interface MatchResultForm {
  homeScore: number;
  awayScore: number;
  notes?: string;
}

interface GoalScorer {
  playerId: string;
  minute: number;
  notes?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
   // Estados para el diálogo de resultado
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  // Estados para el formulario de resultado
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  // Estados para el registro de anotadores (simplificado con cantidad)
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [goalCount, setGoalCount] = useState<string>("1");
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, selectedSport, selectedCategory]);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterMatches = () => {
    let filtered = matches;

    if (selectedSport !== "ALL") {
      filtered = filtered.filter(match => match.league.sportType === selectedSport);
    }

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(match => match.league.ageCategory === selectedCategory);
    }

    setFilteredMatches(filtered);
  };

  const openResultDialog = async (match: MatchWithDetails) => {
    setSelectedMatch(match);
    setHomeScore(match.result?.homeScore?.toString() || "");
    setAwayScore(match.result?.awayScore?.toString() || "");
    setNotes(match.result?.notes || "");
    
    // Cargar jugadores de ambos equipos
    try {
      const homePlayersResponse = await fetch(`/api/players?teamIds=${match.homeTeamId}`);
      const awayPlayersResponse = await fetch(`/api/players?teamIds=${match.awayTeamId}`);
      
      if (homePlayersResponse.ok && awayPlayersResponse.ok) {
        const homePlayers = await homePlayersResponse.json();
        const awayPlayers = await awayPlayersResponse.json();
        setPlayers([...homePlayers, ...awayPlayers]);
      }
    } catch (error) {
      console.error("Error loading players:", error);
    }
    
    // Cargar goles existentes si hay un resultado
    if (match.result?.goals) {
      setGoals(match.result.goals);
    } else {
      setGoals([]);
    }
    
    setSelectedPlayerId(""); // Resetear selección de jugador
    setGoalCount("1"); // Resetear cantidad
    setResultDialogOpen(true);
  };

  const saveResult = async () => {
    if (!selectedMatch) return;

    try {
      const resultData = {
        matchId: selectedMatch.id,
        homeScore: parseInt(homeScore) || 0,
        awayScore: parseInt(awayScore) || 0,
        notes: notes || undefined,
        goals: goals.length > 0 ? goals : undefined
      };

      const response = await fetch(`/api/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });

      if (response.ok) {
        await fetchMatches(); // Refrescar la lista
        setResultDialogOpen(false);
        // Reset form
        setHomeScore("");
        setAwayScore("");
        setNotes("");
        setGoals([]);
        setSelectedPlayerId("");
        setGoalCount("1");
      }
    } catch (error) {
      console.error("Error saving result:", error);
    }
  };

  // Funciones para manejar goles (simplificado con cantidad)
  const addGoal = () => {
    if (!selectedPlayerId || !goalCount) return;
    
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) return;
    
    const count = parseInt(goalCount) || 1;
    const newGoals = [];
    
    // Crear múltiples entradas de goles para el mismo jugador
    for (let i = 0; i < count; i++) {
      newGoals.push({
        playerId: selectedPlayerId,
        minute: 1, // Minuto por defecto
        isOwnGoal: false,
        isPenalty: false,
        notes: ""
      });
    }
    
    setGoals([...goals, ...newGoals]);
    setSelectedPlayerId(""); // Resetear selección
    setGoalCount("1"); // Resetear cantidad a 1
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const removePlayerGoals = (playerId: string) => {
    setGoals(goals.filter(goal => goal.playerId !== playerId));
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.name} (${player.team.name})` : "Jugador desconocido";
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

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      SCHEDULED: "outline",
      IN_PROGRESS: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
      POSTPONED: "outline"
    };

    const labels: { [key: string]: string } = {
      SCHEDULED: "Programado",
      IN_PROGRESS: "En Progreso",
      COMPLETED: "Finalizado",
      CANCELLED: "Cancelado",
      POSTPONED: "Postergado"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando partidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-10 h-10" />
          <h1 className="text-4xl font-bold tracking-tight">
            Gestión de Partidos
          </h1>
        </div>
        <p className="text-xl text-emerald-50">
          Visualización y registro de resultados de partidos
        </p>
        <div className="flex items-center justify-center gap-2 text-emerald-100">
          <Users className="w-5 h-5" />
          <span>Registra anotadores y detalles de cada partido</span>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calendar className="w-5 h-5" />
            Filtros
          </CardTitle>
          <CardDescription className="text-blue-600">
            Filtra los partidos por deporte y categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-blue-700 font-medium">Deporte</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Selecciona un deporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los deportes</SelectItem>
                  <SelectItem value="FOOTBALL">Fútbol ⚽</SelectItem>
                  <SelectItem value="BASKETBALL">Baloncesto 🏀</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-blue-700 font-medium">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las categorías</SelectItem>
                  <SelectItem value="GRADE_1_2">1°-2° Grado</SelectItem>
                  <SelectItem value="GRADE_3_4">3°-4° Grado</SelectItem>
                  <SelectItem value="GRADE_5_6">5°-6° Grado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Partidos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-600" />
            Partidos ({filteredMatches.length})
          </h2>
        </div>

        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron partidos</h3>
              <p className="text-muted-foreground text-center">
                No hay partidos que coincidan con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Encabezado del partido */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSportIcon(match.league.sportType)}</span>
                          <Badge variant="outline">
                            {getAgeCategoryLabel(match.league.ageCategory)}
                          </Badge>
                          {getStatusBadge(match.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Jornada {match.round}
                        </div>
                      </div>

                      {/* Equipos y resultado */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <div className="font-semibold text-lg">{match.homeTeam.name}</div>
                            <div className="text-sm text-muted-foreground">Local</div>
                          </div>
                          <div className="text-center">
                            {match.result ? (
                              <div className="text-2xl font-bold">
                                {match.result.homeScore} - {match.result.awayScore}
                              </div>
                            ) : (
                              <div className="text-2xl font-bold text-muted-foreground">
                                VS
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-lg">{match.awayTeam.name}</div>
                            <div className="text-sm text-muted-foreground">Visitante</div>
                          </div>
                        </div>
                      </div>

                      {/* Información del partido */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(match.matchDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(match.matchTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {match.location}
                        </div>
                        {match.result?.goals && match.result.goals.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{match.result.goals.length} anotadores</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="ml-4">
                      <Button 
                        onClick={() => openResultDialog(match)}
                        variant={match.result ? "outline" : "default"}
                      >
                        {match.result ? "Editar Resultado" : "Registrar Resultado"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo para registrar/editar resultado */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMatch?.result ? "Editar Resultado" : "Registrar Resultado"}
            </DialogTitle>
            <DialogDescription>
              {selectedMatch && (
                <>
                  {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                  <br />
                  {formatDate(selectedMatch.matchDate)} - {formatTime(selectedMatch.matchTime)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Resultado básico */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resultado</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{selectedMatch?.homeTeam.name}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{selectedMatch?.awayTeam.name}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  placeholder="Observaciones del partido"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Registro de anotadores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Anotadores</h3>
              
              {/* Lista de goles registrados (agrupados por jugador) */}
              {goals.length > 0 && (
                <div className="space-y-2">
                  <Label>Anotadores registrados:</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(() => {
                      // Agrupar goles por jugador
                      const goalsByPlayer = goals.reduce((acc, goal) => {
                        if (!acc[goal.playerId]) {
                          acc[goal.playerId] = 0;
                        }
                        acc[goal.playerId]++;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      return Object.entries(goalsByPlayer).map(([playerId, count]) => (
                        <div key={playerId} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getPlayerName(playerId)}</span>
                            <Badge variant="secondary">
                              {count} {count === 1 ? 'gol' : 'goles'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePlayerGoals(playerId)}
                              className="h-8 px-3"
                            >
                              Quitar todos
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Formulario para añadir nuevo gol (simplificado con cantidad) */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Añadir anotador</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jugador</Label>
                    <Select
                      value={selectedPlayerId}
                      onValueChange={(value) => setSelectedPlayerId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un jugador" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.team.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de goles</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={goalCount}
                      onChange={(e) => setGoalCount(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addGoal}
                  disabled={!selectedPlayerId || !goalCount}
                  className="w-full"
                >
                  Añadir anotador
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResultDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveResult}>
                Guardar Resultado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}