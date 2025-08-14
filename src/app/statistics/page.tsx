"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Star
} from "lucide-react";
import { League, Team, Match, Result, Player } from "@prisma/client";

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

interface LeagueStats {
  id: string;
  name: string;
  sportType: string;
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  totalGoals: number;
  topScorer?: PlayerStats;
}

interface GeneralStats {
  totalLeagues: number;
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  totalGoals: number;
  activeLeagues: number;
  completedMatches: number;
}

export default function StatisticsPage() {
  const [leagues, setLeagues] = useState<LeagueStats[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeneralStats();
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchLeagueStats(selectedLeague);
    }
  }, [selectedLeague]);

  const fetchGeneralStats = async () => {
    try {
      // Fetch all data needed for general stats
      const [leaguesRes, teamsRes, playersRes, matchesRes] = await Promise.all([
        fetch("/api/leagues"),
        fetch("/api/teams"),
        fetch("/api/players"),
        fetch("/api/matches"),
      ]);

      if (leaguesRes.ok && teamsRes.ok && playersRes.ok && matchesRes.ok) {
        const leaguesData = await leaguesRes.json();
        const teamsData = await teamsRes.json();
        const playersData = await playersRes.json();
        const matchesData = await matchesRes.json();

        const totalGoals = matchesData.reduce((acc: number, match: any) => {
          if (match.result) {
            return acc + (match.result.homeScore || 0) + (match.result.awayScore || 0);
          }
          return acc;
        }, 0);

        const completedMatches = matchesData.filter((match: any) => 
          match.status === "COMPLETED"
        ).length;

        const activeLeagues = leaguesData.filter((league: any) => league.isActive).length;

        setGeneralStats({
          totalLeagues: leaguesData.length,
          totalTeams: teamsData.length,
          totalPlayers: playersData.length,
          totalMatches: matchesData.length,
          totalGoals,
          activeLeagues,
          completedMatches,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas generales",
        variant: "destructive",
      });
    }
  };

  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues");
      if (response.ok) {
        const data = await response.json();
        const leaguesWithStats: LeagueStats[] = await Promise.all(
          data.map(async (league: any) => {
            const matches = await fetch(`/api/matches?leagueId=${league.id}`);
            const matchesData = matches.ok ? await matches.json() : [];
            
            const totalGoals = matchesData.reduce((acc: number, match: any) => {
              if (match.result) {
                return acc + (match.result.homeScore || 0) + (match.result.awayScore || 0);
              }
              return acc;
            }, 0);

            const completedMatches = matchesData.filter((match: any) => 
              match.status === "COMPLETED"
            ).length;

            return {
              id: league.id,
              name: league.name,
              sportType: league.sportType,
              totalTeams: league._count.teams,
              totalMatches: league._count.matches,
              completedMatches,
              totalGoals,
            };
          })
        );
        setLeagues(leaguesWithStats);
        
        if (leaguesWithStats.length > 0) {
          setSelectedLeague(leaguesWithStats[0].id);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ligas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueStats = async (leagueId: string) => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        fetch(`/api/matches?leagueId=${leagueId}&status=COMPLETED`),
        fetch(`/api/teams?leagueId=${leagueId}`),
      ]);

      if (matchesRes.ok && teamsRes.ok) {
        const matches = await matchesRes.json();
        const teams = await teamsRes.json();

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

        setTeamStats(sortedTeamStats);

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
          .slice(0, 20); // Top 20 scorers

        setPlayerStats(sortedPlayerStats);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de la liga",
        variant: "destructive",
      });
    }
  };

  const getSportIcon = (sportType: string) => {
    return sportType === "FOOTBALL" ? (
      <span className="text-lg">⚽</span>
    ) : (
      <span className="text-lg">🏀</span>
    );
  };

  const getPositionBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500 hover:bg-yellow-600">1°</Badge>;
    if (index === 1) return <Badge className="bg-gray-400 hover:bg-gray-500">2°</Badge>;
    if (index === 2) return <Badge className="bg-orange-600 hover:bg-orange-700">3°</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis y reportes del sistema de ligas deportivas
          </p>
        </div>
      </div>

      {/* League Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Liga</CardTitle>
          <CardDescription>
            Elige una liga para ver sus estadísticas detalladas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una liga" />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((league) => (
                <SelectItem key={league.id} value={league.id}>
                  <div className="flex items-center gap-2">
                    {getSportIcon(league.sportType)}
                    <span>{league.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* General Stats */}
      {generalStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ligas</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.totalLeagues}</div>
              <p className="text-xs text-muted-foreground">
                {generalStats.activeLeagues} activas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                Participantes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jugadores</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">
                Atletas registrados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Goles</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.totalGoals}</div>
              <p className="text-xs text-muted-foreground">
                En {generalStats.completedMatches} partidos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* League Overview */}
      {selectedLeague && (
        <Tabs defaultValue="standings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">Tabla de Posiciones</TabsTrigger>
            <TabsTrigger value="scorers">Máximos Goleadores</TabsTrigger>
            <TabsTrigger value="overview">Resumen de Liga</TabsTrigger>
          </TabsList>

          {/* Standings Table */}
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Posiciones</CardTitle>
                <CardDescription>
                  Clasificación actual de los equipos en la liga
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
                    {teamStats.map((team, index) => (
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
                {teamStats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay partidos completados en esta liga
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Scorers */}
          <TabsContent value="scorers">
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Goleadores</CardTitle>
                <CardDescription>
                  Jugadores con más goles en la liga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {playerStats.map((player, index) => (
                    <Card key={player.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Medal className={`h-5 w-5 ${
                                index === 0 ? "text-yellow-500" :
                                index === 1 ? "text-gray-400" :
                                "text-orange-600"
                              }`} />
                            )}
                            <span className="text-2xl font-bold">#{index + 1}</span>
                          </div>
                          <div className="text-2xl font-bold text-primary">
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
                            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {playerStats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay goles registrados en esta liga
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* League Overview */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              {leagues.find(l => l.id === selectedLeague) && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Estadísticas de la Liga
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total de Equipos</span>
                          <span className="font-medium">
                            {leagues.find(l => l.id === selectedLeague)?.totalTeams}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Partidos Programados</span>
                          <span className="font-medium">
                            {leagues.find(l => l.id === selectedLeague)?.totalMatches}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Partidos Completados</span>
                          <span className="font-medium">
                            {leagues.find(l => l.id === selectedLeague)?.completedMatches}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de Goles</span>
                          <span className="font-medium">
                            {leagues.find(l => l.id === selectedLeague)?.totalGoals}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso de la Liga</span>
                          <span>
                            {leagues.find(l => l.id === selectedLeague)?.totalMatches ? 
                              Math.round((leagues.find(l => l.id === selectedLeague)!.completedMatches / leagues.find(l => l.id === selectedLeague)!.totalMatches) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={leagues.find(l => l.id === selectedLeague)?.totalMatches ? 
                            (leagues.find(l => l.id === selectedLeague)!.completedMatches / leagues.find(l => l.id === selectedLeague)!.totalMatches) * 100 
                            : 0
                          } 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Distribución de Resultados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {teamStats.length > 0 && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Partidos Ganados</span>
                              <span>
                                {teamStats.reduce((acc, team) => acc + team.won, 0)}
                              </span>
                            </div>
                            <Progress 
                              value={(teamStats.reduce((acc, team) => acc + team.won, 0) / teamStats.reduce((acc, team) => acc + team.played, 0)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Empates</span>
                              <span>
                                {teamStats.reduce((acc, team) => acc + team.drawn, 0)}
                              </span>
                            </div>
                            <Progress 
                              value={(teamStats.reduce((acc, team) => acc + team.drawn, 0) / teamStats.reduce((acc, team) => acc + team.played, 0)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Partidos Perdidos</span>
                              <span>
                                {teamStats.reduce((acc, team) => acc + team.lost, 0)}
                              </span>
                            </div>
                            <Progress 
                              value={(teamStats.reduce((acc, team) => acc + team.lost, 0) / teamStats.reduce((acc, team) => acc + team.played, 0)) * 100} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Promedio de Goles por Partido</span>
                            <span className="font-medium">
                              {leagues.find(l => l.id === selectedLeague)?.completedMatches ? 
                                (leagues.find(l => l.id === selectedLeague)!.totalGoals / leagues.find(l => l.id === selectedLeague)!.completedMatches).toFixed(1)
                                : "0.0"
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Equipo Más Goleador</span>
                            <span className="font-medium">
                              {teamStats.length > 0 ? teamStats.reduce((max, team) => team.goalsFor > max.goalsFor ? team : max).name : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Mejor Defensa</span>
                            <span className="font-medium">
                              {teamStats.length > 0 ? teamStats.reduce((min, team) => team.goalsAgainst < min.goalsAgainst ? team : min).name : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}