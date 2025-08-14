"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CalendarX,
  CheckCircle,
  Clock
} from "lucide-react";
import { League } from "@/types";

interface ScheduleManagement {
  leagueId: string;
  leagueName: string;
  sportType: string;
  ageCategory: string;
  totalMatches: number;
  hasSchedule: boolean;
}

export default function ScheduleManagementPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<ScheduleManagement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues");
      if (response.ok) {
        const leaguesData = await response.json();
        setLeagues(leaguesData);
        await fetchScheduleData(leaguesData);
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleData = async (leaguesData: League[]) => {
    try {
      const schedulePromises = leaguesData.map(async (league) => {
        const matchesResponse = await fetch(`/api/matches?leagueId=${league.id}`);
        const matches = matchesResponse.ok ? await matchesResponse.json() : [];
        
        return {
          leagueId: league.id,
          leagueName: league.name,
          sportType: league.sportType,
          ageCategory: league.ageCategory,
          totalMatches: matches.length,
          hasSchedule: matches.length > 0
        };
      });

      const scheduleResults = await Promise.all(schedulePromises);
      setScheduleData(scheduleResults);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
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

  const handleDeleteSchedule = async () => {
    if (!selectedLeague) return;

    setIsProcessing(true);
    setActionResult(null);

    try {
      const response = await fetch("/api/delete-schedule", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leagueId: selectedLeague.leagueId }),
      });

      if (response.ok) {
        const result = await response.json();
        setActionResult({
          type: 'success',
          message: `Calendario eliminado: ${result.deletedMatches} partidos eliminados de ${result.leagueName}`
        });
        await fetchLeagues();
        setIsDeleteDialogOpen(false);
        setSelectedLeague(null);
      } else {
        const error = await response.json();
        setActionResult({
          type: 'error',
          message: error.error || "Error al eliminar el calendario"
        });
      }
    } catch (error) {
      setActionResult({
        type: 'error',
        message: "Error al eliminar el calendario"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!selectedLeague) return;

    setIsProcessing(true);
    setActionResult(null);

    try {
      const response = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leagueId: selectedLeague.leagueId }),
      });

      if (response.ok) {
        const result = await response.json();
        setActionResult({
          type: 'success',
          message: `Calendario generado: ${result.totalMatches} partidos creados para ${selectedLeague.leagueName}`
        });
        await fetchLeagues();
        setIsGenerateDialogOpen(false);
        setSelectedLeague(null);
      } else {
        const error = await response.json();
        setActionResult({
          type: 'error',
          message: error.error || "Error al generar el calendario"
        });
      }
    } catch (error) {
      setActionResult({
        type: 'error',
        message: "Error al generar el calendario"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDeleteDialog = (league: ScheduleManagement) => {
    setSelectedLeague(league);
    setIsDeleteDialogOpen(true);
  };

  const openGenerateDialog = (league: ScheduleManagement) => {
    setSelectedLeague(league);
    setIsGenerateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calendar className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-bold tracking-tight">
            Gestión de Calendarios
          </h1>
          <CalendarX className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elimina calendarios existentes y genera nuevos para todas las ligas
        </p>
      </div>

      {/* Action Result Alert */}
      {actionResult && (
        <Alert className={actionResult.type === 'success' ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {actionResult.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={actionResult.type === 'success' ? "text-green-800" : "text-red-800"}>
            {actionResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Leagues Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scheduleData.map((league) => (
          <Card key={league.leagueId} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSportIcon(league.sportType)}</span>
                  <CardTitle className="text-lg">{league.leagueName}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {league.hasSchedule ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <CalendarX className="w-3 h-3 mr-1" />
                      Sin calendario
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {getAgeCategoryLabel(league.ageCategory)} • {league.totalMatches} partidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {league.hasSchedule ? (
                  <span>El calendario está activo con {league.totalMatches} partidos programados</span>
                ) : (
                  <span>No hay calendario programado para esta liga</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {league.hasSchedule && (
                  <Dialog open={isDeleteDialogOpen && selectedLeague?.leagueId === league.leagueId} onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setSelectedLeague(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openDeleteDialog(league)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          Eliminar Calendario
                        </DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que quieres eliminar el calendario de <strong>{league.leagueName}</strong>?
                          <br /><br />
                          Esta acción eliminará permanentemente todos los partidos ({league.totalMatches}) 
                          y sus resultados asociados. Esta acción no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteSchedule}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar Calendario
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Dialog open={isGenerateDialogOpen && selectedLeague?.leagueId === league.leagueId} onOpenChange={(open) => {
                  setIsGenerateDialogOpen(open);
                  if (!open) setSelectedLeague(null);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant={league.hasSchedule ? "outline" : "default"}
                      size="sm" 
                      className="flex-1"
                      onClick={() => openGenerateDialog(league)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {league.hasSchedule ? "Regenerar" : "Generar"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        {league.hasSchedule ? "Regenerar Calendario" : "Generar Calendario"}
                      </DialogTitle>
                      <DialogDescription>
                        {league.hasSchedule ? (
                          <>
                            ¿Estás seguro de que quieres regenerar el calendario de <strong>{league.leagueName}</strong>?
                            <br /><br />
                            Esta acción eliminará el calendario actual ({league.totalMatches} partidos) 
                            y creará uno nuevo. Todos los resultados existentes se perderán.
                          </>
                        ) : (
                          <>
                            ¿Estás seguro de que quieres generar el calendario para <strong>{league.leagueName}</strong>?
                            <br /><br />
                            Se creará un calendario completo con todos los partidos de la temporada.
                          </>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleGenerateSchedule}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            {league.hasSchedule ? "Regenerar" : "Generar"}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          <CardDescription>
            Opciones para gestionar múltiples calendarios a la vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Eliminar todos los calendarios</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Elimina todos los partidos de todas las ligas para empezar desde cero
              </p>
              <Button variant="destructive" size="sm" disabled>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Todo (Próximamente)
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Regenerar todos los calendarios</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Vuelve a generar todos los calendarios manteniendo la configuración actual
              </p>
              <Button variant="outline" size="sm" disabled>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar Todo (Próximamente)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}