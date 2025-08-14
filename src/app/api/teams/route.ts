import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");

    const teams = await db.team.findMany({
      where: leagueId ? { leagueId } : {},
      include: {
        league: true,
        players: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Error fetching teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      leagueId,
      coachName,
      color,
    } = body;

    // Validaciones básicas
    if (!name || !leagueId) {
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

    // Verificar si ya existe un equipo con el mismo nombre en la liga
    const existingTeam = await db.team.findFirst({
      where: {
        name,
        leagueId,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team with this name already exists in the league" },
        { status: 400 }
      );
    }

    // Verificar el límite de equipos si está definido
    if (league.maxTeams) {
      const teamCount = await db.team.count({
        where: { leagueId },
      });

      if (teamCount >= league.maxTeams) {
        return NextResponse.json(
          { error: `League has reached the maximum number of teams (${league.maxTeams})` },
          { status: 400 }
        );
      }
    }

    // Crear el equipo
    const team = await db.team.create({
      data: {
        name,
        description,
        leagueId,
        coachName,
        color,
      },
      include: {
        league: true,
        players: true,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Error creating team" },
      { status: 500 }
    );
  }
}