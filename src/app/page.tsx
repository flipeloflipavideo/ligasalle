"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Users, 
  Loader2,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";

interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface TopScorerRow {
  playerId: string;
  playerName: string;
  teamName: string;
  teamColor: string;
  goals: number;
  leagueName: string;
  ageCategory: string;
  sportType: string;
}

interface StandingsByCategory {
  [category: string]: StandingRow[];
}

interface TopScorersByCategory {
  [category: string]: TopScorerRow[];
}

export default function HomePage() {
  const [footballStandings, setFootballStandings] = useState<StandingsByCategory>({});
  const [basketballStandings, setBasketballStandings] = useState<StandingsByCategory>({});
  const [footballTopScorers, setFootballTopScorers] = useState<TopScorersByCategory>({});
  const [basketballTopScorers, setBasketballTopScorers] = useState<TopScorersByCategory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [footballStandingsRes, basketballStandingsRes, footballTopScorersRes, basketballTopScorersRes] = await Promise.all([
        fetch("/api/standings?sportType=FOOTBALL"),
        fetch("/api/standings?sportType=BASKETBALL"),
        fetch("/api/top-scorers?sportType=FOOTBALL"),
        fetch("/api/top-scorers?sportType=BASKETBALL"),
      ]);

      if (footballStandingsRes.ok) {
        const footballData = await footballStandingsRes.json();
        setFootballStandings(footballData);
      }

      if (basketballStandingsRes.ok) {
        const basketballData = await basketballStandingsRes.json();
        setBasketballStandings(basketballData);
      }

      if (footballTopScorersRes.ok) {
        const footballScorersData = await footballTopScorersRes.json();
        setFootballTopScorers(footballScorersData);
      }

      if (basketballTopScorersRes.ok) {
        const basketballScorersData = await basketballTopScorersRes.json();
        setBasketballTopScorers(basketballScorersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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

  const renderStandingsTable = (standings: StandingsByCategory, topScorers: TopScorersByCategory, sportType: string) => {
    const categories = Object.keys(standings).sort();

    if (categories.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay clasificaciones disponibles</h3>
            <p className="text-muted-foreground text-center">
              Aún no se han jugado partidos en esta categoría
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="grid gap-6 lg:grid-cols-3">
            {/* Tabla de clasificaciones */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">{getSportIcon(sportType)}</span>
                    {getAgeCategoryLabel(category)} - Clasificación
                  </CardTitle>
                  <CardDescription>
                    Tabla de posiciones actualizada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Pos</th>
                          <th className="text-left p-2">Equipo</th>
                          <th className="text-center p-2">PJ</th>
                          <th className="text-center p-2">PG</th>
                          <th className="text-center p-2">PE</th>
                          <th className="text-center p-2">PP</th>
                          <th className="text-center p-2">GF</th>
                          <th className="text-center p-2">GC</th>
                          <th className="text-center p-2">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings[category].map((team, index) => (
                          <tr key={team.teamId} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">
                              {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 inline mr-1" />}
                              {index + 1}
                            </td>
                            <td className="p-2 font-medium">{team.teamName}</td>
                            <td className="p-2 text-center">{team.played}</td>
                            <td className="p-2 text-center">{team.won}</td>
                            <td className="p-2 text-center">{team.drawn}</td>
                            <td className="p-2 text-center">{team.lost}</td>
                            <td className="p-2 text-center">{team.goalsFor}</td>
                            <td className="p-2 text-center">{team.goalsAgainst}</td>
                            <td className="p-2 text-center font-bold">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de anotadores */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    {getAgeCategoryLabel(category)} - Anotadores
                  </CardTitle>
                  <CardDescription>
                    Tabla de goleadores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(topScorers[category])?.slice(0, 10).map((scorer, index) => (
                      <div key={scorer.playerId} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{scorer.playerName}</div>
                            <div className="text-xs text-muted-foreground">{scorer.teamName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {scorer.goals} {scorer.goals === 1 ? 'gol' : 'goles'}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-8">
                        No hay anotadores registrados
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando clasificaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Sistema de Gestión de Ligas Deportivas
        </h1>
        <p className="text-xl text-muted-foreground">
          Clasificaciones y estadísticas de las ligas escolares
        </p>
      </div>

      {/* Sport Tabs */}
      <Tabs defaultValue="football" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="football" className="flex items-center gap-2">
              <span>⚽</span>
              Fútbol ({Object.keys(footballStandings).length})
            </TabsTrigger>
            <TabsTrigger value="basketball" className="flex items-center gap-2">
              <span>🏀</span>
              Baloncesto ({Object.keys(basketballStandings).length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="football" className="space-y-6">
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    {Object.keys(footballStandings).length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Categorías Activas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {Object.values(footballStandings).reduce((acc, standings) => acc + standings.length, 0)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Equipos Participando</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-6 h-6 text-green-500" />
                  <span className="text-2xl font-bold">
                    {Object.values(footballTopScorers).reduce((acc, scorers) => 
                      acc + scorers.reduce((scorerAcc, scorer) => scorerAcc + scorer.goals, 0), 0
                    )}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Goles Anotados</div>
              </CardContent>
            </Card>
          </div>
          {renderStandingsTable(footballStandings, footballTopScorers, "FOOTBALL")}
        </TabsContent>

        <TabsContent value="basketball" className="space-y-6">
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    {Object.keys(basketballStandings).length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Categorías Activas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {Object.values(basketballStandings).reduce((acc, standings) => acc + standings.length, 0)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Equipos Participando</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <span className="text-2xl font-bold">
                    {Object.values(basketballTopScorers).reduce((acc, scorers) => 
                      acc + scorers.reduce((scorerAcc, scorer) => scorerAcc + scorer.goals, 0), 0
                    )}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Puntos Anotados</div>
              </CardContent>
            </Card>
          </div>
          {renderStandingsTable(basketballStandings, basketballTopScorers, "BASKETBALL")}
        </TabsContent>
      </Tabs>
    </div>
  );
}