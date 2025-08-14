import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIds = searchParams.get("teamIds");
    const leagueId = searchParams.get("leagueId");
    const teamId = searchParams.get("teamId"); // Para obtener jugadores de un equipo específico

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
    } else if (teamId) {
      // Si se proporciona teamId, filtrar por ese equipo
      whereClause.teamId = teamId;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, teamId, annotations, isActive = true } = body;

    // Validar campos requeridos
    if (!name || !teamId) {
      return NextResponse.json(
        { error: "Name and teamId are required" },
        { status: 400 }
      );
    }

    // Verificar que el equipo existe
    const team = await db.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Crear el jugador
    const player = await db.player.create({
      data: {
        name,
        teamId,
        annotations: annotations || null,
        isActive,
      },
      include: {
        team: {
          include: {
            league: true,
          },
        },
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Error creating player" },
      { status: 500 }
    );
  }
}