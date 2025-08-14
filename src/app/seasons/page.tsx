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
import { Calendar, Plus, Edit, Trash2, Trophy, Star, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isMain: boolean;
  schoolYear?: string;
  leagues: Array<{
    id: string;
    name: string;
    sportType: string;
    ageCategory: string;
    _count: {
      teams: number;
      matches: number;
    };
  }>;
  holidays: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>;
  _count: {
    leagues: number;
  };
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: true,
    isMain: false,
    schoolYear: "",
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
      console.error("Error fetching seasons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/seasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setFormData({
          name: "",
          startDate: "",
          endDate: "",
          isActive: true,
          isMain: false,
          schoolYear: "",
        });
        fetchSeasons();
      } else {
        console.error("Error creating season");
      }
    } catch (error) {
      console.error("Error creating season:", error);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Temporadas</h1>
          <p className="text-muted-foreground">
            Gestión de temporadas académicas y ligas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Temporada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Temporada</DialogTitle>
              <DialogDescription>
                Crea una nueva temporada académica. Si marcas como principal, se crearán automáticamente las 6 ligas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Temporada</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: 2024-2025"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="schoolYear">Año Escolar</Label>
                <Input
                  id="schoolYear"
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  placeholder="Ej: 2024-2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Temporada Activa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isMain"
                    checked={formData.isMain}
                    onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isMain">Temporada Principal</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Temporada</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seasons Grid */}
      <div className="grid gap-6">
        {seasons.length > 0 ? (
          seasons.map((season) => (
            <Card key={season.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{season.name}</CardTitle>
                      {season.isMain && (
                        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                          <Star className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                      {season.isActive && (
                        <Badge variant="default">Activa</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {format(new Date(season.startDate), "dd MMM yyyy", { locale: es })} -{" "}
                      {format(new Date(season.endDate), "dd MMM yyyy", { locale: es })}
                      {season.schoolYear && ` • Año escolar: ${season.schoolYear}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{season._count.leagues}</div>
                      <div className="text-sm text-muted-foreground">Ligas</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {season.leagues.reduce((acc, league) => acc + league._count.teams, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Equipos</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {season.leagues.reduce((acc, league) => acc + league._count.matches, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Partidos</div>
                    </div>
                  </div>

                  {/* Leagues */}
                  {season.leagues.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Ligas de esta temporada
                      </h4>
                      <div className="grid gap-2">
                        {season.leagues.map((league) => (
                          <div key={league.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getSportIcon(league.sportType)}</span>
                              <div>
                                <div className="font-medium">{league.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {getAgeCategoryLabel(league.ageCategory)} • {league._count.teams} equipos • {league._count.matches} partidos
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {league.sportType === "FOOTBALL" ? "Fútbol" : "Baloncesto"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Holidays */}
                  {season.holidays.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Períodos vacacionales
                      </h4>
                      <div className="grid gap-2">
                        {season.holidays.map((holiday) => (
                          <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{holiday.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(holiday.startDate), "dd MMM yyyy", { locale: es })} -{" "}
                                {format(new Date(holiday.endDate), "dd MMM yyyy", { locale: es })}
                              </div>
                              {holiday.description && (
                                <div className="text-xs text-muted-foreground mt-1">{holiday.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay temporadas</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crea tu primera temporada para comenzar a gestionar las ligas deportivas
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Temporada
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