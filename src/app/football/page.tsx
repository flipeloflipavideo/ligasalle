"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Users, 
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Medal,
  Star,
  Crown
} from "lucide-react";
import { League, Team, Match, Result, Player, AgeCategory } from "@prisma/client";

interface TeamStats {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  color?: string;
}

interface PlayerStats {
  id: string;
  name: string;
  lastName: string;
  teamName: string;
  goals: number;
  teamColor?: string;
}

interface CategoryStats {
  category: AgeCategory;
  leagues: League[];
  teamStats: TeamStats[];
  playerStats: PlayerStats[];
  totalMatches: number;
  completedMatches: number;
  totalGoals: number;
}

export default function FootballPage() {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFootballData();
  }, []);

  const fetchFootballData = async () => {
    try {
      // Fetch all football leagues
      const leaguesRes = await fetch("/api/leagues");
      if (!leaguesRes.ok) throw new Error("Failed to fetch leagues");
      
      const allLeagues = await leaguesRes.json();
      const footballLeagues = allLeagues.filter((league: any) => league.sportType === "FOOTBALL");

      // Group by category
      const categoryMap = new Map<AgeCategory, League[]>();
      footballLeagues.forEach((league: any) => {
        if (!categoryMap.has(league.ageCategory)) {
          categoryMap.set(league.ageCategory, []);
        }
        categoryMap.get(league.ageCategory)!.push(league);
      });

      // Process each category
      const categoriesData: CategoryStats[] = await Promise.all(
        Array.from(categoryMap.entries()).asyncMap(async ([category, leagues]) => {
          const leagueIds = leagues.map((l: any) => l.id);
          
          // Fetch matches for these leagues
          const matchesPromises = leagueIds.map(id => fetch(`/api/matches?leagueId=${id}&status=COMPLETED`));
          const matchesResponses = await Promise.all(matchesPromises);
          const allMatches = await Promise.all(
            matchesResponses.map(res => res.ok ? res.json() : [])
          );
          const matches = allMatches.flat();

          // Fetch teams for these leagues
          const teamsPromises = leagueIds.map(id => fetch(`/api/teams?leagueId=${id}`));
          const teamsResponses = await Promise.all(teamsPromises);
          const allTeams = await Promise.all(
            teamsResponses.map(res => res.ok ? res.json() : [])
          );
          const teams = allTeams.flat();

          // Calculate team statistics
          const teamsMap = new Map<string, TeamStats>();
          
          // Initialize team stats
          teams.forEach((team: any) => {
            teamsMap.set(team.id, {
              id: team.id,
              name: team.name,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              color: team.color,
            });
          });

          // Process matches
          matches.forEach((match: any) => {
            if (!match.result) return;

            const homeTeam = teamsMap.get(match.homeTeamId);
            const awayTeam = teamsMap.get(match.awayTeamId);

            if (homeTeam && awayTeam) {
              const homeScore = match.result.homeScore || 0;
              const awayScore = match.result.awayScore || 0;

              // Update stats for both teams
              [homeTeam, awayTeam].forEach((team, isHome) => {
                const score = isHome ? homeScore : awayScore;
                const opponentScore = isHome ? awayScore : homeScore;
                
                team.played++;
                team.goalsFor += score;
                team.goalsAgainst += opponentScore;
                team.goalDifference = team.goalsFor - team.goalsAgainst;

                if (score > opponentScore) {
                  team.won++;
                  team.points += 3;
                } else if (score === opponentScore) {
                  team.drawn++;
                  team.points += 1;
                } else {
                  team.lost++;
                }
              });
            }
          });

          const sortedTeamStats = Array.from(teamsMap.values()).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return 0;
          });

          // Calculate player statistics (top scorers)
          const playerGoals = new Map<string, PlayerStats>();
          
          matches.forEach((match: any) => {
            if (match.result && match.result.goals) {
              match.result.goals.forEach((goal: any) => {
                const player = goal.player;
                if (player) {
                  const key = player.id;
                  const existing = playerGoals.get(key) || {
                    id: player.id,
                    name: player.name,
                    lastName: player.lastName,
                    teamName: player.team.name,
                    goals: 0,
                    teamColor: player.team.color,
                  };
                  existing.goals++;
                  playerGoals.set(key, existing);
                }
              });
            }
          });

          const sortedPlayerStats = Array.from(playerGoals.values())
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10); // Top 10 scorers

          const totalGoals = matches.reduce((acc: number, match: any) => {
            if (match.result) {
              return acc + (match.result.homeScore || 0) + (match.result.awayScore || 0);
            }
            return acc;
          }, 0);

          return {
            category,
            leagues,
            teamStats: sortedTeamStats,
            playerStats: sortedPlayerStats,
            totalMatches: matches.length,
            completedMatches: matches.length,
            totalGoals,
          };
        })
      );

      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de fútbol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: AgeCategory) => {
    switch (category) {
      case AgeCategory.GRADE_1_2:
        return "1°-2° Grado";
      case AgeCategory.GRADE_3_4:
        return "3°-4° Grado";
      case AgeCategory.GRADE_5_6:
        return "5°-6° Grado";
      default:
        return category;
    }
  };

  const getPositionBadge = (index: number) => {
    if (index === 0) return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <Crown className="h-3 w-3 mr-1" />
        1°
      </Badge>
    );
    if (index === 1) return <Badge className="bg-gray-400 hover:bg-gray-500 text-white">2°</Badge>;
    if (index === 2) return <Badge className="bg-orange-600 hover:bg-orange-700 text-white">3°</Badge>;
    return <Badge variant="outline">{index + 1}°</Badge>;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">⚽</span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fútbol</h1>
            <p className="text-muted-foreground">
              Clasificaciones y tabla de goleadores
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ligas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Categorías activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((acc, cat) => acc + cat.teamStats.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Participantes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((acc, cat) => acc + cat.completedMatches, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              De {categories.reduce((acc, cat) => acc + cat.totalMatches, 0)} programados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goles</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((acc, cat) => acc + cat.totalGoals, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Anotados en total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Tabs */}
      <Tabs defaultValue={categories.length > 0 ? categories[0].category : ""} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {categories.map((category) => (
            <TabsTrigger key={category.category} value={category.category}>
              {getCategoryLabel(category.category)}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.category} value={category.category} className="space-y-6">
            {/* Category Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {getCategoryLabel(category.category)}
                </CardTitle>
                <CardDescription>
                  {category.leagues.map(league => league.name).join(", ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{category.teamStats.length}</div>
                    <div className="text-sm text-muted-foreground">Equipos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{category.completedMatches}</div>
                    <div className="text-sm text-muted-foreground">Partidos Jugados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{category.totalGoals}</div>
                    <div className="text-sm text-muted-foreground">Goles Totales</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Standings Table */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tabla de Posiciones</CardTitle>
                    <CardDescription>
                      Clasificación actual de los equipos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pos</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead className="text-center">PJ</TableHead>
                          <TableHead className="text-center">PG</TableHead>
                          <TableHead className="text-center">PE</TableHead>
                          <TableHead className="text-center">PP</TableHead>
                          <TableHead className="text-center">GF</TableHead>
                          <TableHead className="text-center">GC</TableHead>
                          <TableHead className="text-center">DG</TableHead>
                          <TableHead className="text-center">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.teamStats.map((team, index) => (
                          <TableRow key={team.id}>
                            <TableCell>
                              {getPositionBadge(index)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {team.color && (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: team.color }}
                                  />
                                )}
                                <span className="font-medium">{team.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{team.played}</TableCell>
                            <TableCell className="text-center">{team.won}</TableCell>
                            <TableCell className="text-center">{team.drawn}</TableCell>
                            <TableCell className="text-center">{team.lost}</TableCell>
                            <TableCell className="text-center">{team.goalsFor}</TableCell>
                            <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                            <TableCell className="text-center">
                              <span className={team.goalDifference > 0 ? "text-green-600" : team.goalDifference < 0 ? "text-red-600" : ""}>
                                {team.goalDifference > 0 ? "+" : ""}{team.goalDifference}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-bold">{team.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {category.teamStats.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay equipos en esta categoría
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Scorers */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Goleadores
                    </CardTitle>
                    <CardDescription>
                      Máximos anotadores de la categoría
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.playerStats.map((player, index) => (
                        <Card key={player.id} className="relative">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {index < 3 && (
                                  <Medal className={`h-5 w-5 ${
                                    index === 0 ? "text-yellow-500" :
                                    index === 1 ? "text-gray-400" :
                                    "text-orange-600"
                                  }`} />
                                )}
                                <span className="text-lg font-bold">#{index + 1}</span>
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {player.goals}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {player.name} {player.lastName}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {player.teamColor && (
                                  <div
                                    className="w-3 h-3 rounded-full border"
                                    style={{ backgroundColor: player.teamColor }}
                                  />
                                )}
                                <span>{player.teamName}</span>
                              </div>
                            </div>
                            {index === 0 && player.goals > 0 && (
                              <div className="absolute -top-1 -right-1">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {category.playerStats.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay goles registrados
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <span className="text-6xl text-muted-foreground mx-auto mb-4">⚽</span>
            <h3 className="text-lg font-semibold mb-2">No hay ligas de fútbol</h3>
            <p className="text-muted-foreground mb-4">
              No se encontraron ligas de fútbol registradas en el sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}