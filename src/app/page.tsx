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
        <Card className="transform hover:scale-105 transition-all duration-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No hay clasificaciones disponibles</h3>
            <p className="text-muted-foreground text-center">
              Aún no se han jugado partidos en esta categoría
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category} className="grid gap-8 lg:grid-cols-3">
            {/* Tabla de clasificaciones */}
            <div className="lg:col-span-2">
              <Card className="transform hover:scale-105 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <span className="text-2xl">{getSportIcon(sportType)}</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {getAgeCategoryLabel(category)} - Clasificación
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Tabla de posiciones actualizada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold text-uppercase text-sm tracking-wider">Pos</th>
                          <th className="text-left p-3 font-semibold text-uppercase text-sm tracking-wider">Equipo</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">PJ</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">PG</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">PE</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">PP</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">GF</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">GC</th>
                          <th className="text-center p-3 font-semibold text-uppercase text-sm tracking-wider">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings[category].map((team, index) => (
                          <tr key={team.teamId} className="border-b hover:bg-muted/50 transition-all duration-200">
                            <td className="p-3 font-medium">
                              <div className="flex items-center gap-2">
                                {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                                {index === 1 && <div className="w-5 h-5 flex items-center justify-center text-lg">🥈</div>}
                                {index === 2 && <div className="w-5 h-5 flex items-center justify-center text-lg">🥉</div>}
                                {index > 2 && <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{index + 1}</span>}
                              </div>
                            </td>
                            <td className="p-3 font-medium">{team.teamName}</td>
                            <td className="p-3 text-center">{team.played}</td>
                            <td className="p-3 text-center">{team.won}</td>
                            <td className="p-3 text-center">{team.drawn}</td>
                            <td className="p-3 text-center">{team.lost}</td>
                            <td className="p-3 text-center">{team.goalsFor}</td>
                            <td className="p-3 text-center">{team.goalsAgainst}</td>
                            <td className="p-3 text-center font-bold text-lg">{team.points}</td>
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
              <Card className="transform hover:scale-105 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Zap className="w-6 h-6 text-orange-500" />
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {getAgeCategoryLabel(category)} - Anotadores
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Tabla de goleadores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(topScorers[category])?.slice(0, 10).map((scorer, index) => (
                      <div key={scorer.playerId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                            'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{scorer.playerName}</div>
                            <div className="text-xs text-muted-foreground">{scorer.teamName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold">
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
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 bg-primary blur-3xl opacity-20 -z-10"></div>
            </div>
            <div className="space-y-2">
              <span className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Cargando clasificaciones...
              </span>
              <p className="text-muted-foreground">
                Estamos preparando los datos del torneo
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
      {/* Header mejorado */}
      <div className="text-center space-y-6">
        <div className="relative">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sistema de Gestión de Ligas Deportivas
            </span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-3xl opacity-20 -z-10"></div>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Clasificaciones y estadísticas de las ligas escolares
        </p>
      </div>

      {/* Sport Tabs */}
      <Tabs defaultValue="football" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="football" className="flex items-center gap-2">
              <span className="text-xl">⚽</span>
              Fútbol ({Object.keys(footballStandings).length})
            </TabsTrigger>
            <TabsTrigger value="basketball" className="flex items-center gap-2">
              <span className="text-xl">🏀</span>
              Baloncesto ({Object.keys(basketballStandings).length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="football" className="space-y-6">
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <Card className="transform hover:scale-105 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <span className="text-3xl font-bold text-yellow-500">
                    {Object.keys(footballStandings).length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Categorías Activas</div>
              </CardContent>
            </Card>
            <Card className="transform hover:scale-105 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold text-blue-500">
                    {Object.values(footballStandings).reduce((acc, standings) => acc + standings.length, 0)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Equipos Participando</div>
              </CardContent>
            </Card>
            <Card className="transform hover:scale-105 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold text-green-500">
                    {Object.values(footballTopScorers).reduce((acc, scorers) => 
                      acc + scorers.reduce((scorerAcc, scorer) => scorerAcc + scorer.goals, 0), 0
                    )}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Goles Anotados</div>
              </CardContent>
            </Card>
          </div>
          {renderStandingsTable(footballStandings, footballTopScorers, "FOOTBALL")}
        </TabsContent>

        <TabsContent value="basketball" className="space-y-6">
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <Card className="transform hover:scale-105 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <span className="text-3xl font-bold text-yellow-500">
                    {Object.keys(basketballStandings).length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Categorías Activas</div>
              </CardContent>
            </Card>
            <Card className="transform hover:scale-105 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold text-blue-500">
                    {Object.values(basketballStandings).reduce((acc, standings) => acc + standings.length, 0)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Equipos Participando</div>
              </CardContent>
            </Card>
            <Card className="transform hover:scale-105 transition-all duration-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold text-green-500">
                    {Object.values(basketballTopScorers).reduce((acc, scorers) => 
                      acc + scorers.reduce((scorerAcc, scorer) => scorerAcc + scorer.goals, 0), 0
                    )}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Puntos Anotados</div>
              </CardContent>
            </Card>
          </div>
          {renderStandingsTable(basketballStandings, basketballTopScorers, "BASKETBALL")}
        </TabsContent>
      </Tabs>
    </div>
  );
}