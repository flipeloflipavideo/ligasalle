export interface Team {
  id: string;
  name: string;
  description?: string;
  leagueId: string;
  coachName?: string;
  color?: string;
  shieldUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  sportType: "FOOTBALL" | "BASKETBALL";
  ageCategory: "GRADE_1_2" | "GRADE_3_4" | "GRADE_5_6";
  seasonId: string;
  maxTeams?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: Date;
  matchTime: Date;
  location?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "POSTPONED";
  round?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  playerId: string;
  resultId: string;
  minute: number;
  isOwnGoal: boolean;
  isPenalty: boolean;
  notes?: string;
  createdAt: Date;
  player?: Player;
}

export interface Result {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  isFinished: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  goals?: Goal[];
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  annotations?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  team?: Team;
}

export interface MatchWithDetails extends Match {
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  result?: Result;
}

export interface StandingRow {
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

export interface StandingsByCategory {
  [category: string]: StandingRow[];
}