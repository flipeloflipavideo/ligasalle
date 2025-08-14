import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const league = await db.league.findUnique({
      where: { id: params.id },
      include: {
        season: true,
        teams: {
          include: {
            players: true,
          },
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            result: true,
          },
          orderBy: {
            matchDate: "asc",
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(league);
  } catch (error) {
    console.error("Error fetching league:", error);
    return NextResponse.json(
      { error: "Error fetching league" },
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
      sportType,
      ageCategory,
      seasonId,
      maxTeams,
      isActive,
    } = body;

    // Verificar que la liga existe
    const existingLeague = await db.league.findUnique({
      where: { id: params.id },
    });

    if (!existingLeague) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Si se cambia la temporada, verificar que existe
    if (seasonId && seasonId !== existingLeague.seasonId) {
      const season = await db.season.findUnique({
        where: { id: seasonId },
      });

      if (!season) {
        return NextResponse.json(
          { error: "Season not found" },
          { status: 404 }
        );
      }
    }

    // Actualizar la liga
    const league = await db.league.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sportType && { sportType }),
        ...(ageCategory && { ageCategory }),
        ...(seasonId && { seasonId }),
        ...(maxTeams !== undefined && { maxTeams: maxTeams ? parseInt(maxTeams) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        season: true,
        teams: true,
      },
    });

    return NextResponse.json(league);
  } catch (error) {
    console.error("Error updating league:", error);
    return NextResponse.json(
      { error: "Error updating league" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la liga existe
    const existingLeague = await db.league.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });

    if (!existingLeague) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Verificar si hay equipos o partidos asociados
    if (existingLeague._count.teams > 0 || existingLeague._count.matches > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete league with associated teams or matches",
          teams: existingLeague._count.teams,
          matches: existingLeague._count.matches,
        },
        { status: 400 }
      );
    }

    // Eliminar la liga
    await db.league.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "League deleted successfully" });
  } catch (error) {
    console.error("Error deleting league:", error);
    return NextResponse.json(
      { error: "Error deleting league" },
      { status: 500 }
    );
  }
}