import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get("sportType") || "FOOTBALL";

    // Get all leagues for the sport type
    const leagues = await db.league.findMany({
      where: { sportType },
      include: {
        teams: {
          include: {
            homeMatches: {
              include: { result: true },
              where: {
                result: { isFinished: true } // Solo partidos con resultados
              },
            },
            awayMatches: {
              include: { result: true },
              where: {
                result: { isFinished: true } // Solo partidos con resultados
              },
            },
          },
        },
      },
    });

    const standingsByCategory: Record<string, StandingRow[]> = {};

    for (const league of leagues) {
      const category = league.ageCategory;
      const standings: StandingRow[] = [];

      for (const team of league.teams) {
        const allMatches = [...team.homeMatches, ...team.awayMatches];
        
        let played = 0;
        let won = 0;
        let drawn = 0;
        let lost = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;
        let points = 0;

        for (const match of allMatches) {
          if (!match.result) continue;

          played++;
          
          const isHome = match.homeTeamId === team.id;
          const teamGoals = isHome ? match.result.homeScore : match.result.awayScore;
          const opponentGoals = isHome ? match.result.awayScore : match.result.homeScore;

          goalsFor += teamGoals;
          goalsAgainst += opponentGoals;

          if (teamGoals > opponentGoals) {
            won++;
            points += 3;
          } else if (teamGoals === opponentGoals) {
            drawn++;
            points += 1;
          } else {
            lost++;
          }
        }

        if (played > 0) {
          standings.push({
            teamId: team.id,
            teamName: team.name,
            played,
            won,
            drawn,
            lost,
            goalsFor,
            goalsAgainst,
            points,
          });
        }
      }

      // Sort by points, then by goal difference, then by goals for
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const goalDiffA = a.goalsFor - a.goalsAgainst;
        const goalDiffB = b.goalsFor - b.goalsAgainst;
        if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
        return b.goalsFor - a.goalsFor;
      });

      if (standings.length > 0) {
        standingsByCategory[category] = standings;
      }
    }

    return NextResponse.json(standingsByCategory);
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Error fetching standings" },
      { status: 500 }
    );
  }
}