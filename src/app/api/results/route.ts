import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    const results = await db.result.findMany({
      where: matchId ? { matchId } : {},
      include: {
        match: {
          include: {
            league: true,
            homeTeam: true,
            awayTeam: true,
          },
        },
        goals: {
          include: {
            player: {
              include: {
                team: true,
              },
            },
          },
          orderBy: {
            minute: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Error fetching results" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      matchId,
      homeScore,
      awayScore,
      isFinished,
      notes,
      goals, // Array de goles/anotaciones
    } = body;

    // Validaciones básicas
    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verificar que el partido existe
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        result: true,
        league: {
          include: {
            teams: {
              include: {
                players: true,
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

    // Validar que los goles correspondan a jugadores del partido
    if (goals && goals.length > 0) {
      const teamIds = [match.homeTeamId, match.awayTeamId];
      const playerIds = goals.map((goal: any) => goal.playerId);
      
      const validPlayers = await db.player.findMany({
        where: {
          id: { in: playerIds },
          teamId: { in: teamIds },
        },
      });

      if (validPlayers.length !== playerIds.length) {
        return NextResponse.json(
          { error: "Some players are not valid for this match" },
          { status: 400 }
        );
      }
    }

    // Si ya existe un resultado para este partido, actualizarlo
    if (match.result) {
      // Actualizar resultado
      const updatedResult = await db.result.update({
        where: { id: match.result.id },
        data: {
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          isFinished: isFinished !== undefined ? isFinished : true,
          notes,
        },
        include: {
          match: {
            include: {
              league: true,
              homeTeam: true,
              awayTeam: true,
            },
          },
          goals: {
            include: {
              player: {
                include: {
                  team: true,
                },
              },
            },
            orderBy: {
              minute: "asc",
            },
          },
        },
      });

      // Eliminar goles existentes y crear nuevos (si se proporcionan)
      if (goals !== undefined) {
        await db.goal.deleteMany({
          where: { resultId: match.result.id },
        });

        if (goals.length > 0) {
          await db.goal.createMany({
            data: goals.map((goal: any) => ({
              playerId: goal.playerId,
              resultId: match.result.id,
              minute: goal.minute,
              isOwnGoal: goal.isOwnGoal || false,
              isPenalty: goal.isPenalty || false,
              notes: goal.notes,
            })),
          });
        }
      }

      // Actualizar el estado del partido si está finalizado
      if (isFinished) {
        await db.match.update({
          where: { id: matchId },
          data: { status: "COMPLETED" },
        });
      }

      // Retornar el resultado actualizado con los goles
      const finalResult = await db.result.findUnique({
        where: { id: match.result.id },
        include: {
          match: {
            include: {
              league: true,
              homeTeam: true,
              awayTeam: true,
            },
          },
          goals: {
            include: {
              player: {
                include: {
                  team: true,
                },
              },
            },
            orderBy: {
              minute: "asc",
            },
          },
        },
      });

      return NextResponse.json(finalResult);
    }

    // Crear nuevo resultado
    const result = await db.result.create({
      data: {
        matchId,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        isFinished: isFinished !== undefined ? isFinished : true,
        notes,
      },
      include: {
        match: {
          include: {
            league: true,
            homeTeam: true,
            awayTeam: true,
          },
        },
        goals: {
          include: {
            player: true,
          },
          orderBy: {
            minute: "asc",
          },
        },
      },
    });

    // Crear goles si se proporcionan
    if (goals && goals.length > 0) {
      await db.goal.createMany({
        data: goals.map((goal: any) => ({
          playerId: goal.playerId,
          resultId: result.id,
          minute: goal.minute,
          isOwnGoal: goal.isOwnGoal || false,
          isPenalty: goal.isPenalty || false,
          notes: goal.notes,
        })),
      });
    }

    // Actualizar el estado del partido si está finalizado
    if (isFinished) {
      await db.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED" },
      });
    }

    // Retornar el resultado final con los goles
    const finalResult = await db.result.findUnique({
      where: { id: result.id },
      include: {
        match: {
          include: {
            league: true,
            homeTeam: true,
            awayTeam: true,
          },
        },
        goals: {
          include: {
            player: {
              include: {
                team: true,
              },
            },
          },
          orderBy: {
            minute: "asc",
          },
        },
      },
    });

    return NextResponse.json(finalResult, { status: 201 });
  } catch (error) {
    console.error("Error creating result:", error);
    return NextResponse.json(
      { error: "Error creating result" },
      { status: 500 }
    );
  }
}