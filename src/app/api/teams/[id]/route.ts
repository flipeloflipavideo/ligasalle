import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        league: true,
        players: true,
        homeMatches: {
          include: {
            awayTeam: true,
            result: true,
          },
          orderBy: {
            matchDate: "desc",
          },
        },
        awayMatches: {
          include: {
            homeTeam: true,
            result: true,
          },
          orderBy: {
            matchDate: "desc",
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Error fetching team" },
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
      name,
      description,
      leagueId,
      coachName,
      color,
      isActive,
    } = body;

    // Verificar que el equipo existe
    const existingTeam = await db.team.findUnique({
      where: { id: params.id },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Si se cambia la liga, verificar que existe
    if (leagueId && leagueId !== existingTeam.leagueId) {
      const league = await db.league.findUnique({
        where: { id: leagueId },
      });

      if (!league) {
        return NextResponse.json(
          { error: "League not found" },
          { status: 404 }
        );
      }

      // Verificar si ya existe un equipo con el mismo nombre en la nueva liga
      const teamWithSameName = await db.team.findFirst({
        where: {
          name: name || existingTeam.name,
          leagueId,
          id: { not: params.id },
        },
      });

      if (teamWithSameName) {
        return NextResponse.json(
          { error: "Team with this name already exists in the league" },
          { status: 400 }
        );
      }
    }

    // Actualizar el equipo
    const team = await db.team.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(leagueId && { leagueId }),
        ...(coachName !== undefined && { coachName }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        league: true,
        players: true,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Error updating team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el equipo existe
    const existingTeam = await db.team.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Verificar si hay jugadores o partidos asociados
    if (
      existingTeam._count.players > 0 ||
      existingTeam._count.homeMatches > 0 ||
      existingTeam._count.awayMatches > 0
    ) {
      return NextResponse.json(
        { 
          error: "Cannot delete team with associated players or matches",
          players: existingTeam._count.players,
          matches: existingTeam._count.homeMatches + existingTeam._count.awayMatches,
        },
        { status: 400 }
      );
    }

    // Eliminar el equipo
    await db.team.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Error deleting team" },
      { status: 500 }
    );
  }
}