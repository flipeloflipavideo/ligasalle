import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await db.player.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            league: true,
          },
        },
        goals: {
          include: {
            result: {
              include: {
                match: {
                  include: {
                    homeTeam: true,
                    awayTeam: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Error fetching player" },
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
      lastName,
      teamId,
      jerseyNumber,
      position,
      birthDate,
      isActive,
      annotations,
    } = body;

    // Verificar que el jugador existe
    const existingPlayer = await db.player.findUnique({
      where: { id: params.id },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Si se cambia el equipo, verificar que existe
    if (teamId && teamId !== existingPlayer.teamId) {
      const team = await db.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return NextResponse.json(
          { error: "Team not found" },
          { status: 404 }
        );
      }
    }

    // Verificar si el número de camiseta ya está en uso (excluyendo al jugador actual)
    const finalTeamId = teamId || existingPlayer.teamId;
    const finalJerseyNumber = jerseyNumber !== undefined ? parseInt(jerseyNumber) : existingPlayer.jerseyNumber;

    if (finalJerseyNumber) {
      const playerWithSameJersey = await db.player.findFirst({
        where: {
          teamId: finalTeamId,
          jerseyNumber: finalJerseyNumber,
          id: { not: params.id },
        },
      });

      if (playerWithSameJersey) {
        return NextResponse.json(
          { error: "Jersey number already in use in this team" },
          { status: 400 }
        );
      }
    }

    // Actualizar el jugador
    const player = await db.player.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(lastName && { lastName }),
        ...(teamId && { teamId }),
        ...(jerseyNumber !== undefined && { jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null }),
        ...(position !== undefined && { position }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(annotations !== undefined && { annotations }),
      },
      include: {
        team: {
          include: {
            league: true,
          },
        },
        goals: true,
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Error updating player" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el jugador existe
    const existingPlayer = await db.player.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            goals: true,
          },
        },
      },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Verificar si tiene goles asociados
    if (existingPlayer._count.goals > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete player with associated goals",
          goals: existingPlayer._count.goals,
        },
        { status: 400 }
      );
    }

    // Eliminar el jugador
    await db.player.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Error deleting player" },
      { status: 500 }
    );
  }
}