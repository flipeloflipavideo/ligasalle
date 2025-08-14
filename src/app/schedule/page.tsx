"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trophy,
  Play,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface League {
  id: string;
  name: string;
  sportType: string;
  ageCategory: string;
  season: {
    id: string;
    name: string;
  };
  _count: {
    teams: number;
    matches: number;
  };
}

interface Match {
  id: string;
  matchDate: string;
  matchTime: string;
  location: string;
  status: string;
  round: number;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  result?: {
    homeScore: number;
    awayScore: number;
    isFinished: boolean;
  };
}

export default function SchedulePage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<any>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchMatches(selectedLeague.id);
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

  const fetchMatches = async (leagueId: string) => {
    try {
      const response = await fetch(`/api/matches?leagueId=${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const generateSchedule = async () => {
    if (!selectedLeague) return;

    setGenerating(true);
    setGenerationResult(null);

    try {
      const response = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueId: selectedLeague.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGenerationResult(result);
        fetchMatches(selectedLeague.id);
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        setGenerationResult({ error: error.error });
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      setGenerationResult({ error: "Error generating schedule" });
    } finally {
      setGenerating(false);
    }
  };

  const deleteSchedule = async () => {
    if (!selectedLeague) return;

    setDeleting(true);
    setDeleteResult(null);

    try {
      const response = await fetch("/api/delete-schedule", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueId: selectedLeague.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDeleteResult(result);
        fetchMatches(selectedLeague.id);
        setIsDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        setDeleteResult({ error: error.error });
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setDeleteResult({ error: "Error deleting schedule" });
    } finally {
      setDeleting(false);
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

  const getStatusBadge = (status: string, result?: any) => {
    if (result?.isFinished) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Finalizado
        </Badge>
      );
    }
    
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Programado
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Play className="w-3 h-3 mr-1" />
            En Progreso
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completado
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      case "POSTPONED":
        return (
          <Badge variant="secondary">
            <RefreshCw className="w-3 h-3 mr-1" />
            Postergado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Partidos</h1>
          <p className="text-muted-foreground">
            Genera y gestiona el calendario de partidos por liga
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* League Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar Liga</CardTitle>
              <CardDescription>
                Elige una liga para ver/generar su calendario
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
                        {league._count.teams}
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

        {/* Schedule Management */}
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
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Calendar className="w-4 h-4 mr-2" />
                            Generar Calendario
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Generar Calendario</DialogTitle>
                            <DialogDescription>
                              Esto generará un calendario round-robin para la liga {selectedLeague.name}. 
                              Los partidos se programarán todos los viernes durante la temporada, 
                              excluyendo períodos vacacionales.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {selectedLeague._count.teams === 4 && (
                                  <>Se jugarán 2 partidos cada viernes (total de 6 equipos)</>
                                )}
                                {selectedLeague._count.teams === 6 && (
                                  <>Se jugarán 3 partidos cada viernes (total de 15 equipos)</>
                                )}
                                {selectedLeague._count.teams < 4 && (
                                  <>Se necesitan al menos 4 equipos para generar el calendario</>
                                )}
                                {selectedLeague._count.teams > 6 && (
                                  <>Se jugarán múltiples partidos cada viernes según el número de equipos</>
                                )}
                              </AlertDescription>
                            </Alert>
                            
                            {generationResult && (
                              <Alert className={generationResult.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                                {generationResult.error ? (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <AlertDescription className={generationResult.error ? "text-red-800" : "text-green-800"}>
                                  {generationResult.error || (
                                    <>
                                      Calendario generado exitosamente:
                                      <br />
                                      • {generationResult.totalMatches} partidos creados
                                      <br />
                                      • {generationResult.rounds} jornadas
                                      <br />
                                      • {generationResult.fridaysUsed} viernes utilizados
                                    </>
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              onClick={generateSchedule} 
                              disabled={generating || selectedLeague._count.teams < 4}
                            >
                              {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              {selectedLeague._count.teams < 4 ? "Equipos insuficientes" : "Generar Calendario"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" disabled={matches.length === 0}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Eliminar Calendario
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Eliminar Calendario</DialogTitle>
                            <DialogDescription>
                              Esto eliminará todos los partidos del calendario de la liga {selectedLeague.name}. 
                              Esta acción no se puede deshacer.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <Alert className="border-red-200 bg-red-50">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800">
                                {matches.length > 0 ? (
                                  <>
                                    Se eliminarán {matches.length} partidos del calendario.
                                    <br />
                                    Esta acción eliminará permanentemente todos los partidos programados.
                                  </>
                                ) : (
                                  <>No hay partidos para eliminar en esta liga.</>
                                )}
                              </AlertDescription>
                            </Alert>
                            
                            {deleteResult && (
                              <Alert className={deleteResult.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                                {deleteResult.error ? (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <AlertDescription className={deleteResult.error ? "text-red-800" : "text-green-800"}>
                                  {deleteResult.error || (
                                    <>
                                      Calendario eliminado exitosamente:
                                      <br />
                                      • {deleteResult.deletedMatches} partidos eliminados
                                      <br />
                                      • Liga: {deleteResult.leagueName}
                                    </>
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={deleteSchedule} 
                              disabled={deleting || matches.length === 0}
                            >
                              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              {matches.length === 0 ? "No hay partidos" : "Eliminar Calendario"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold">{selectedLeague._count.teams}</div>
                      <div className="text-sm text-muted-foreground">Equipos</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold">{matches.length}</div>
                      <div className="text-sm text-muted-foreground">Partidos</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold">
                        {Math.max(...matches.map(m => m.round || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Jornadas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matches List */}
              <Card>
                <CardHeader>
                  <CardTitle>Partidos Programados</CardTitle>
                  <CardDescription>
                    Todos los partidos de la liga ordenados por fecha
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {matches.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jornada</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Partido</TableHead>
                          <TableHead>Lugar</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Resultado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell>
                              <Badge variant="outline">J{match.round}</Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(match.matchDate), "dd MMM yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(match.matchTime), "HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {match.homeTeam.name} vs {match.awayTeam.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {match.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(match.status, match.result)}
                            </TableCell>
                            <TableCell>
                              {match.result ? (
                                <div className="font-mono text-sm">
                                  {match.result.homeScore} - {match.result.awayScore}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No hay partidos programados</h3>
                      <p className="mb-4">
                        Genera el calendario para comenzar a programar los partidos
                      </p>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Calendar className="w-4 h-4 mr-2" />
                            Generar Calendario
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona una liga</h3>
                <p className="text-muted-foreground text-center">
                  Elige una liga de la lista para ver o generar su calendario
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}