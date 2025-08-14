import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.result.findUnique({
      where: { id: params.id },
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

    if (!result) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { error: "Error fetching result" },
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
      homeScore,
      awayScore,
      isFinished,
      notes,
    } = body;

    // Verificar que el resultado existe
    const existingResult = await db.result.findUnique({
      where: { id: params.id },
      include: {
        match: true,
      },
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    // Actualizar el resultado
    const result = await db.result.update({
      where: { id: params.id },
      data: {
        ...(homeScore !== undefined && { homeScore: parseInt(homeScore) }),
        ...(awayScore !== undefined && { awayScore: parseInt(awayScore) }),
        ...(isFinished !== undefined && { isFinished }),
        ...(notes !== undefined && { notes }),
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

    // Actualizar el estado del partido si está finalizado
    if (isFinished) {
      await db.match.update({
        where: { id: existingResult.matchId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { error: "Error updating result" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el resultado existe
    const existingResult = await db.result.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            goals: true,
          },
        },
      },
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    // Verificar si tiene goles asociados
    if (existingResult._count.goals > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete result with associated goals",
          goals: existingResult._count.goals,
        },
        { status: 400 }
      );
    }

    // Eliminar el resultado
    await db.result.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Result deleted successfully" });
  } catch (error) {
    console.error("Error deleting result:", error);
    return NextResponse.json(
      { error: "Error deleting result" },
      { status: 500 }
    );
  }
}