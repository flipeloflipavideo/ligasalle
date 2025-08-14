import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MatchStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    const whereClause: any = {};
    if (leagueId) whereClause.leagueId = leagueId;
    if (status) whereClause.status = status as MatchStatus;
    if (upcoming) {
      whereClause.matchDate = { gte: new Date() };
      whereClause.status = MatchStatus.SCHEDULED;
    }

    const matches = await db.match.findMany({
      where: whereClause,
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        result: {
          include: {
            goals: {
              include: {
                player: true,
              },
            },
          },
        },
      },
      orderBy: {
        matchDate: upcoming ? "asc" : "desc",
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Error fetching matches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leagueId,
      homeTeamId,
      awayTeamId,
      matchDate,
      matchTime,
      location,
      round,
    } = body;

    // Validaciones básicas
    if (!leagueId || !homeTeamId || !awayTeamId || !matchDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verificar que la liga existe
    const league = await db.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Verificar que los equipos existen
    const [homeTeam, awayTeam] = await Promise.all([
      db.team.findUnique({ where: { id: homeTeamId } }),
      db.team.findUnique({ where: { id: awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: "One or both teams not found" },
        { status: 404 }
      );
    }

    // Verificar que los equipos pertenecen a la misma liga
    if (homeTeam.leagueId !== leagueId || awayTeam.leagueId !== leagueId) {
      return NextResponse.json(
        { error: "Teams must belong to the same league" },
        { status: 400 }
      );
    }

    // Verificar que no sea el mismo equipo
    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: "Home and away teams cannot be the same" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un partido entre los mismos equipos en la misma fecha
    const existingMatch = await db.match.findFirst({
      where: {
        leagueId,
        homeTeamId,
        awayTeamId,
        matchDate: new Date(matchDate),
      },
    });

    if (existingMatch) {
      return NextResponse.json(
        { error: "A match between these teams already exists on this date" },
        { status: 400 }
      );
    }

    // Crear el partido
    const match = await db.match.create({
      data: {
        leagueId,
        homeTeamId,
        awayTeamId,
        matchDate: new Date(matchDate),
        matchTime: matchTime ? new Date(matchTime) : null,
        location,
        round: round ? parseInt(round) : null,
        status: MatchStatus.SCHEDULED,
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Error creating match" },
      { status: 500 }
    );
  }
}