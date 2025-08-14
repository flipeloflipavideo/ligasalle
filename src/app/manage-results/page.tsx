"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Plus, 
  Minus,
  Save,
  Target,
  Users,
  Calendar,
  MapPin
} from "lucide-react";
import Link from "next/link";

interface Match {
  id: string;
  matchDate: string;
  matchTime: string;
  location: string;
  round: number;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    color: string;
  };
  awayTeam: {
    id: string;
    name: string;
    color: string;
  };
  league: {
    id: string;
    name: string;
    sportType: string;
    ageCategory: string;
  };
  result?: {
    id: string;
    homeScore: number;
    awayScore: number;
    isFinished: boolean;
    notes?: string;
  };
}

interface Player {
  id: string;
  name: string;
  teamId: string;
}

interface GoalEntry {
  playerId: string;
  minute: number;
  isOwnGoal: boolean;
  isPenalty: boolean;
  notes?: string;
}

export default function ManageResults() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

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

  const fetchMatchDetails = async (matchId: string) => {
    try {
      const [matchResponse] = await Promise.all([
        fetch(`/api/matches/${matchId}`),
      ]);

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        setSelectedMatch(matchData);
        setHomeScore(matchData.result?.homeScore || 0);
        setAwayScore(matchData.result?.awayScore || 0);
        setNotes(matchData.result?.notes || "");

        // Obtener jugadores de ambos equipos
        const playersResponse = await fetch(`/api/players?teamIds=${matchData.homeTeamId},${matchData.awayTeamId}`);
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          // Separar jugadores por equipo
          const home = playersData.filter((p: Player) => p.teamId === matchData.homeTeamId);
          const away = playersData.filter((p: Player) => p.teamId === matchData.awayTeamId);
          setHomePlayers(home);
          setAwayPlayers(away);
        }
      }
    } catch (error) {
      console.error("Error fetching match details:", error);
    }
  };

  const addGoal = () => {
    const newGoal: GoalEntry = {
      playerId: "",
      minute: 1,
      isOwnGoal: false,
      isPenalty: false,
    };
    setGoals([...goals, newGoal]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof GoalEntry, value: any) => {
    const updatedGoals = [...goals];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setGoals(updatedGoals);
  };

  const saveResult = async () => {
    if (!selectedMatch) return;

    setSaving(true);
    try {
      const resultData = {
        matchId: selectedMatch.id,
        homeScore,
        awayScore,
        isFinished: true,
        notes,
        goals: goals.length > 0 ? goals : undefined,
      };

      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });

      if (response.ok) {
        alert("Resultado guardado exitosamente");
        // Resetear formulario
        setSelectedMatch(null);
        setGoals([]);
        setHomeScore(0);
        setAwayScore(0);
        setNotes("");
        // Recargar partidos
        fetchMatches();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving result:", error);
      alert("Error al guardar el resultado");
    } finally {
      setSaving(false);
    }
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

  const getSportIcon = (sportType: string) => {
    return sportType === "FOOTBALL" ? "⚽" : "🏀";
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando partidos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Gestión de Resultados
        </h1>
        <p className="text-xl text-muted-foreground">
          Registra resultados y estadísticas de los partidos
        </p>
        <Link href="/">
          <Button variant="outline" size="sm">
            ← Volver al inicio
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="matches">Seleccionar Partido</TabsTrigger>
          <TabsTrigger value="result" disabled={!selectedMatch}>
            Registrar Resultado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-6">
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getSportIcon(match.league.sportType)}</div>
                      <div>
                        <div className="font-semibold">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getAgeCategoryLabel(match.league.ageCategory)} - Jornada {match.round}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(match.matchDate).toLocaleDateString()}
                          <MapPin className="w-3 h-3" />
                          {match.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {match.result && (
                        <Badge variant={match.result.isFinished ? "default" : "secondary"}>
                          {match.result.homeScore} - {match.result.awayScore}
                        </Badge>
                      )}
                      <Badge variant={match.status === "COMPLETED" ? "default" : "secondary"}>
                        {match.status}
                      </Badge>
                      <Button
                        onClick={() => fetchMatchDetails(match.id)}
                        size="sm"
                      >
                        Seleccionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {selectedMatch && (
            <>
              {/* Partido seleccionado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getSportIcon(selectedMatch.league.sportType)}
                    Partido Seleccionado
                  </CardTitle>
                  <CardDescription>
                    {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center">
                      <div className="font-semibold">{selectedMatch.homeTeam.name}</div>
                      <div className="text-3xl font-bold mt-2">
                        <Input
                          type="number"
                          value={homeScore}
                          onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                          className="w-20 text-center mx-auto"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{selectedMatch.awayTeam.name}</div>
                      <div className="text-3xl font-bold mt-2">
                        <Input
                          type="number"
                          value={awayScore}
                          onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                          className="w-20 text-center mx-auto"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="notes">Notas del partido</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observaciones sobre el partido..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Goles/Anotaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Goles/Anotaciones
                  </CardTitle>
                  <CardDescription>
                    Registra los goles y detalles de cada anotación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Anotaciones registradas</span>
                    <Button onClick={addGoal} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir anotación
                    </Button>
                  </div>

                  {goals.map((goal, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid gap-4 md:grid-cols-6">
                        <div>
                          <Label className="text-xs">Jugador</Label>
                          <select
                            value={goal.playerId}
                            onChange={(e) => updateGoal(index, "playerId", e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          >
                            <option value="">Seleccionar jugador</option>
                            <optgroup label={selectedMatch.homeTeam.name}>
                              {homePlayers.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label={selectedMatch.awayTeam.name}>
                              {awayPlayers.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Minuto</Label>
                          <Input
                            type="number"
                            value={goal.minute}
                            onChange={(e) => updateGoal(index, "minute", parseInt(e.target.value) || 0)}
                            className="w-full"
                            min="1"
                            max="120"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <div className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={goal.isOwnGoal}
                              onChange={(e) => updateGoal(index, "isOwnGoal", e.target.checked)}
                              className="rounded"
                            />
                            <Label className="text-xs">En puerta</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={goal.isPenalty}
                              onChange={(e) => updateGoal(index, "isPenalty", e.target.checked)}
                              className="rounded"
                            />
                            <Label className="text-xs">Penalti</Label>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Notas</Label>
                          <Input
                            value={goal.notes || ""}
                            onChange={(e) => updateGoal(index, "notes", e.target.value)}
                            placeholder="Detalles..."
                            className="w-full"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => removeGoal(index)}
                            size="sm"
                            variant="destructive"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {goals.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No hay anotaciones registradas
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Guardar */}
              <div className="flex justify-center">
                <Button onClick={saveResult} disabled={saving} size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Resultado
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}