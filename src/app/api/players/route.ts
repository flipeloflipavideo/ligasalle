import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIds = searchParams.get("teamIds");
    const leagueId = searchParams.get("leagueId");

    // Construir el filtro
    const whereClause: any = {
      isActive: true,
    };

    if (teamIds) {
      // Si se proporcionan teamIds, filtrar por esos equipos
      const teamIdsArray = teamIds.split(",");
      whereClause.teamId = { in: teamIdsArray };
    } else if (leagueId) {
      // Si se proporciona leagueId, obtener jugadores de esa liga
      const teams = await db.team.findMany({
        where: { leagueId },
        select: { id: true },
      });
      const teamIdsArray = teams.map((team) => team.id);
      whereClause.teamId = { in: teamIdsArray };
    }

    const players = await db.player.findMany({
      where: whereClause,
      include: {
        team: {
          include: {
            league: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Error fetching players" },
      { status: 500 }
    );
  }
}