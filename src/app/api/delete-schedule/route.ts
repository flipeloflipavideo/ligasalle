import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId } = body;

    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID is required" },
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

    // Contar cuántos partidos serán eliminados
    const matchesCount = await db.match.count({
      where: { leagueId },
    });

    // Eliminar todos los partidos de esta liga
    const deletedMatches = await db.match.deleteMany({
      where: { leagueId },
    });

    return NextResponse.json({
      message: "Schedule deleted successfully",
      deletedMatches: deletedMatches.count,
      leagueName: league.name,
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Error deleting schedule" },
      { status: 500 }
    );
  }
}