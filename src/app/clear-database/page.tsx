"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Trash2, 
  Database
} from "lucide-react";

interface ClearResult {
  message: string;
  deletedRecords: {
    matches: number;
    results: number;
    players: number;
    teams: number;
    leagues: number;
    holidays: number;
    seasons: number;
  };
  originalCounts: {
    matches: number;
    results: number;
    players: number;
    teams: number;
    leagues: number;
    holidays: number;
    seasons: number;
  };
}

export default function ClearDatabasePage() {
  const [clearing, setClearing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clearResult, setClearResult] = useState<ClearResult | null>(null);

  const clearDatabase = async () => {
    setClearing(true);
    setClearResult(null);

    try {
      const response = await fetch("/api/clear-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setClearResult(result);
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        setClearResult({ 
          message: error.error, 
          deletedRecords: { matches: 0, results: 0, players: 0, teams: 0, leagues: 0, holidays: 0, seasons: 0 },
          originalCounts: { matches: 0, results: 0, players: 0, teams: 0, leagues: 0, holidays: 0, seasons: 0 }
        });
      }
    } catch (error) {
      console.error("Error clearing database:", error);
      setClearResult({ 
        message: "Error clearing database", 
        deletedRecords: { matches: 0, results: 0, players: 0, teams: 0, leagues: 0, holidays: 0, seasons: 0 },
        originalCounts: { matches: 0, results: 0, players: 0, teams: 0, leagues: 0, holidays: 0, seasons: 0 }
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Limpiar Base de Datos</h1>
          <p className="text-muted-foreground">
            Elimina todos los datos del sistema para empezar desde cero
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Warning Card */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Peligro: Acción Irreversible
            </CardTitle>
            <CardDescription className="text-red-700">
              Esta acción eliminará permanentemente todos los datos del sistema, incluyendo:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-red-700 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>• Temporadas</div>
              <div>• Vacaciones</div>
              <div>• Ligas</div>
              <div>• Equipos</div>
              <div>• Jugadores</div>
              <div>• Partidos</div>
              <div>• Resultados</div>
              <div>• Estadísticas</div>
            </div>
            <p className="font-medium mt-4">
              Esta acción no se puede deshacer. Asegúrate de tener respaldos si necesitas conservar los datos.
            </p>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Confirmar Limpieza
            </CardTitle>
            <CardDescription>
              Si estás seguro de que quieres eliminar todos los datos, haz clic en el botón de abajo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar Toda la Base de Datos
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Confirmar Eliminación Total
                  </DialogTitle>
                  <DialogDescription>
                    ¿Estás absolutamente seguro de que quieres eliminar todos los datos del sistema? 
                    Esta acción eliminará permanentemente:
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Esta acción no se puede deshacer.</strong> Todos los datos se perderán permanentemente.
                    </AlertDescription>
                  </Alert>
                  
                  {clearResult && (
                    <Alert className={clearResult.message.includes("exitosamente") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {clearResult.message.includes("exitosamente") ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={clearResult.message.includes("exitosamente") ? "text-green-800" : "text-red-800"}>
                        {clearResult.message.includes("exitosamente") ? (
                          <>
                            Base de datos limpiada exitosamente:
                            <div className="mt-2 space-y-1 text-sm">
                              <div>• Partidos eliminados: {clearResult.deletedRecords.matches}</div>
                              <div>• Resultados eliminados: {clearResult.deletedRecords.results}</div>
                              <div>• Jugadores eliminados: {clearResult.deletedRecords.players}</div>
                              <div>• Equipos eliminados: {clearResult.deletedRecords.teams}</div>
                              <div>• Ligas eliminadas: {clearResult.deletedRecords.leagues}</div>
                              <div>• Temporadas eliminadas: {clearResult.deletedRecords.seasons}</div>
                              <div>• Vacaciones eliminadas: {clearResult.deletedRecords.holidays}</div>
                            </div>
                          </>
                        ) : (
                          clearResult.message
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
                    variant="destructive"
                    onClick={clearDatabase} 
                    disabled={clearing}
                  >
                    {clearing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {clearing ? "Eliminando..." : "Sí, Eliminar Todo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Próximos Pasos</CardTitle>
            <CardDescription>
              Después de limpiar la base de datos, necesitarás:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2 text-sm">
              <div>1. Crear una nueva temporada</div>
              <div>2. Configurar períodos vacacionales</div>
              <div>3. Crear nuevas ligas</div>
              <div>4. Registrar equipos y jugadores</div>
              <div>5. Generar nuevos calendarios</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}