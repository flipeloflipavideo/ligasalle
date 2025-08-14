import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MatchStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const match = await db.match.findUnique({
      where: { id: params.id },
      include: {
        league: true,
        homeTeam: {
          include: {
            players: true,
          },
        },
        awayTeam: {
          include: {
            players: true,
          },
        },
        result: {
          include: {
            goals: {
              include: {
                player: true,
              },
              orderBy: {
                minute: "asc",
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Error fetching match" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
    } = body;

    // Verificar que el partido existe
    const existingMatch = await db.match.findUnique({
      where: { id: params.id },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Validaciones para cambios de equipos
    if (homeTeamId || awayTeamId) {
      const finalHomeTeamId = homeTeamId || existingMatch.homeTeamId;
      const finalAwayTeamId = awayTeamId || existingMatch.awayTeamId;

      // Verificar que no sea el mismo equipo
      if (finalHomeTeamId === finalAwayTeamId) {
        return NextResponse.json(
          { error: "Home and away teams cannot be the same" },
          { status: 400 }
        );
      }

      // Verificar que los equipos existen
      const [homeTeam, awayTeam] = await Promise.all([
        homeTeamId ? db.team.findUnique({ where: { id: homeTeamId } }) : Promise.resolve(null),
        awayTeamId ? db.team.findUnique({ where: { id: awayTeamId } }) : Promise.resolve(null),
      ]);

      if ((homeTeamId && !homeTeam) || (awayTeamId && !awayTeam)) {
        return NextResponse.json(
          { error: "One or both teams not found" },
          { status: 404 }
        );
      }

      // Si se cambia la liga, verificar que existe
      if (leagueId && leagueId !== existingMatch.leagueId) {
        const league = await db.league.findUnique({
          where: { id: leagueId },
        });

        if (!league) {
          return NextResponse.json(
            { error: "League not found" },
            { status: 404 }
          );
        }
      }

      // Verificar que los equipos pertenecen a la misma liga
      const finalLeagueId = leagueId || existingMatch.leagueId;
      if (homeTeam && homeTeam.leagueId !== finalLeagueId) {
        return NextResponse.json(
          { error: "Home team must belong to the same league" },
          { status: 400 }
        );
      }
      if (awayTeam && awayTeam.leagueId !== finalLeagueId) {
        return NextResponse.json(
          { error: "Away team must belong to the same league" },
          { status: 400 }
        );
      }
    }

    // Actualizar el partido
    const match = await db.match.update({
      where: { id: params.id },
      data: {
        ...(leagueId && { leagueId }),
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
        ...(matchDate && { matchDate: new Date(matchDate) }),
        ...(matchTime !== undefined && { matchTime: matchTime ? new Date(matchTime) : null }),
        ...(location !== undefined && { location }),
        ...(round !== undefined && { round: round ? parseInt(round) : null }),
        ...(status && { status: status as MatchStatus }),
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Error updating match" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el partido existe
    const existingMatch = await db.match.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            result: true,
          },
        },
      },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Verificar si tiene un resultado asociado
    if (existingMatch._count.result > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete match with associated result",
          hasResult: true,
        },
        { status: 400 }
      );
    }

    // Eliminar el partido
    await db.match.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Match deleted successfully" });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Error deleting match" },
      { status: 500 }
    );
  }
}