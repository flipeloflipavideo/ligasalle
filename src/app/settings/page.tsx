"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Settings,
  Save,
  X,
  Check,
  Clock
} from "lucide-react";
import { Season } from "@prisma/client";

export default function SettingsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSeasons();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSeason ? `/api/seasons/${editingSeason.id}` : "/api/seasons";
      const method = editingSeason ? "PUT" : "POST";
      
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
          description: editingSeason ? "Temporada actualizada correctamente" : "Temporada creada correctamente",
        });
        fetchSeasons();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo guardar la temporada",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la temporada",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // First check if season has leagues
      const leaguesResponse = await fetch("/api/leagues");
      if (leaguesResponse.ok) {
        const leagues = await leaguesResponse.json();
        const hasLeagues = leagues.some((league: any) => league.seasonId === id);
        
        if (hasLeagues) {
          toast({
            title: "Error",
            description: "No se puede eliminar una temporada que tiene ligas asociadas",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch(`/api/seasons/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Temporada eliminada correctamente",
        });
        fetchSeasons();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo eliminar la temporada",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la temporada",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      startDate: season.startDate.toISOString().split('T')[0],
      endDate: season.endDate.toISOString().split('T')[0],
      isActive: season.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSeason(null);
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isDateRangeValid = () => {
    if (!formData.startDate || !formData.endDate) return true;
    return new Date(formData.endDate) > new Date(formData.startDate);
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
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-6">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
            <Settings className="h-12 w-12 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Configuración</h1>
            <p className="text-xl text-white/90">
              Gestiona las temporadas y configuración del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Seasons Section */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Settings className="h-8 w-8 text-emerald-600" />
                Temporadas
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Gestiona las temporadas académicas para las ligas deportivas
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Temporada
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-gradient-to-br from-white to-gray-50 border border-emerald-200">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-emerald-800">
                      {editingSeason ? "Editar Temporada" : "Crear Nueva Temporada"}
                    </DialogTitle>
                    <DialogDescription className="text-emerald-600">
                      {editingSeason 
                        ? "Modifica los datos de la temporada existente"
                        : "Completa los datos para crear una nueva temporada"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right text-emerald-700">
                        Nombre *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
                        placeholder="Ej: 2024-2025"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startDate" className="text-right text-emerald-700">
                        Fecha Inicio *
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="col-span-3 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endDate" className="text-right text-emerald-700">
                        Fecha Fin *
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="col-span-3 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
                        required
                      />
                    </div>
                    {!isDateRangeValid() && (
                      <div className="col-span-4 text-center">
                        <p className="text-sm text-red-600">
                          La fecha de fin debe ser posterior a la fecha de inicio
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isActive" className="text-right text-emerald-700">
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
                    <Button 
                      type="submit" 
                      disabled={!isDateRangeValid() || !formData.name || !formData.startDate || !formData.endDate}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {editingSeason ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-emerald-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-emerald-100/50">
                <TableRow>
                  <TableHead className="text-emerald-800">Nombre</TableHead>
                  <TableHead className="text-emerald-800">Fecha Inicio</TableHead>
                  <TableHead className="text-emerald-800">Fecha Fin</TableHead>
                  <TableHead className="text-emerald-800">Duración</TableHead>
                  <TableHead className="text-emerald-800">Estado</TableHead>
                  <TableHead className="text-emerald-800">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => {
                  const startDate = new Date(season.startDate);
                  const endDate = new Date(season.endDate);
                  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const isActive = season.isActive;
                  const isCurrent = new Date() >= startDate && new Date() <= endDate;

                  return (
                    <TableRow key={season.id} className="hover:bg-emerald-50/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-emerald-900">{season.name}</div>
                      </TableCell>
                      <TableCell className="text-emerald-700">{formatDate(season.startDate)}</TableCell>
                      <TableCell className="text-emerald-700">{formatDate(season.endDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-emerald-700">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          <span>{duration} días</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                            {isActive ? "Activa" : "Inactiva"}
                          </Badge>
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                              Actual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(season)}
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border border-red-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-800">¿Eliminar Temporada?</AlertDialogTitle>
                                <AlertDialogDescription className="text-red-600">
                                  Esta acción no se puede deshacer. La temporada será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-red-200 text-red-600 hover:bg-red-50">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(season.id)} className="bg-red-600 hover:bg-red-700">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {seasons.length === 0 && (
              <div className="text-center py-8 text-emerald-600 bg-emerald-50/50">
                No hay temporadas registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Management Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-5 w-5 text-blue-600" />
                Gestión de Calendarios
              </CardTitle>
              <CardDescription className="text-blue-600">
                Administra los calendarios de partidos para todas las ligas
              </CardDescription>
            </div>
            <Button 
              onClick={() => window.location.href = "/schedule-management"}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Settings className="mr-2 h-4 w-4" />
              Gestionar Calendarios
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-white/70 backdrop-blur-sm border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <h4 className="font-medium mb-2 text-blue-800">Eliminar Calendarios</h4>
                <p className="text-sm text-blue-600 mb-3">
                  Elimina calendarios existentes para empezar de nuevo
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = "/schedule-management"}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
              <div className="p-4 bg-white/70 backdrop-blur-sm border border-green-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <h4 className="font-medium mb-2 text-green-800">Generar Calendarios</h4>
                <p className="text-sm text-green-600 mb-3">
                  Crea nuevos calendarios para las ligas activas
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = "/schedule-management"}
                  className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Generar
                </Button>
              </div>
              <div className="p-4 bg-white/70 backdrop-blur-sm border border-purple-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <h4 className="font-medium mb-2 text-purple-800">Limpiar Base de Datos</h4>
                <p className="text-sm text-purple-600 mb-3">
                  Elimina todos los datos para empezar desde cero
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => window.location.href = "/clear-database"}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Limpiar Todo
                </Button>
              </div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-blue-200">
              <div className="grid gap-2 text-sm text-blue-700 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Puedes eliminar calendarios específicos por liga</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Los calendarios se generan automáticamente para todos los viernes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>La limpieza de base de datos elimina toda la información permanentemente</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Settings className="h-5 w-5 text-purple-600" />
            Información del Sistema
          </CardTitle>
          <CardDescription className="text-purple-600">
            Detalles sobre la configuración actual del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium mb-3 text-purple-800">Estadísticas Generales</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-purple-700">Total de Temporadas:</span>
                    <span className="font-medium text-purple-900 bg-purple-100 px-2 py-1 rounded">{seasons.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-purple-700">Temporadas Activas:</span>
                    <span className="font-medium text-purple-900 bg-purple-100 px-2 py-1 rounded">{seasons.filter(s => s.isActive).length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-purple-700">Temporada Actual:</span>
                    <span className="font-medium text-purple-900 bg-purple-100 px-2 py-1 rounded">
                      {seasons.find(s => {
                        const now = new Date();
                        const start = new Date(s.startDate);
                        const end = new Date(s.endDate);
                        return now >= start && now <= end;
                      })?.name || "Ninguna"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium mb-3 text-purple-800">Recomendaciones</h4>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Mantén siempre una temporada activa para poder crear ligas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Las fechas de las temporadas no deben superponerse</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Es recomendable crear temporadas con al menos 6 meses de duración</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Desactiva temporadas antiguas para mantener el sistema organizado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}