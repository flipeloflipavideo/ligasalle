import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const matchId = params.id;
    const body = await request.json();
    const { homeScore, awayScore, notes } = body;

    // Validaciones básicas
    if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
      return NextResponse.json(
        { error: "Scores must be numbers" },
        { status: 400 }
      );
    }

    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json(
        { error: "Scores cannot be negative" },
        { status: 400 }
      );
    }

    // Verificar que el partido existe
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        result: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Crear o actualizar el resultado
    const resultData = {
      homeScore,
      awayScore,
      isFinished: true,
      notes: notes || null,
    };

    let result;

    if (match.result) {
      // Actualizar resultado existente
      result = await db.result.update({
        where: { matchId },
        data: resultData,
      });
    } else {
      // Crear nuevo resultado
      result = await db.result.create({
        data: {
          matchId,
          ...resultData,
        },
      });
    }

    // Actualizar el estado del partido a COMPLETED
    await db.match.update({
      where: { id: matchId },
      data: { status: "COMPLETED" },
    });

    // Obtener el partido actualizado con todos los detalles
    const updatedMatch = await db.match.findUnique({
      where: { id: matchId },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    return NextResponse.json({
      message: "Result saved successfully",
      match: updatedMatch,
      result,
    });
  } catch (error) {
    console.error("Error saving result:", error);
    return NextResponse.json(
      { error: "Error saving result" },
      { status: 500 }
    );
  }
}