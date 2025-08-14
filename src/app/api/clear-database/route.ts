import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Contar cuántos registros serán eliminados para mostrar estadísticas
    const matchesCount = await db.match.count();
    const resultsCount = await db.result.count();
    const playersCount = await db.player.count();
    const teamsCount = await db.team.count();
    const leaguesCount = await db.league.count();
    const seasonsCount = await db.season.count();
    const holidaysCount = await db.holiday.count();

    // Eliminar en orden dependiente (primero los que tienen claves foráneas)
    const deletedResults = await db.result.deleteMany({});
    const deletedMatches = await db.match.deleteMany({});
    const deletedPlayers = await db.player.deleteMany({});
    const deletedTeams = await db.team.deleteMany({});
    const deletedLeagues = await db.league.deleteMany({});
    const deletedHolidays = await db.holiday.deleteMany({});
    const deletedSeasons = await db.season.deleteMany({});

    return NextResponse.json({
      message: "Base de datos limpiada exitosamente",
      deletedRecords: {
        matches: deletedMatches.count,
        results: deletedResults.count,
        players: deletedPlayers.count,
        teams: deletedTeams.count,
        leagues: deletedLeagues.count,
        holidays: deletedHolidays.count,
        seasons: deletedSeasons.count,
      },
      originalCounts: {
        matches: matchesCount,
        results: resultsCount,
        players: playersCount,
        teams: teamsCount,
        leagues: leaguesCount,
        holidays: holidaysCount,
        seasons: seasonsCount,
      }
    });
  } catch (error) {
    console.error("Error clearing database:", error);
    return NextResponse.json(
      { error: "Error clearing database" },
      { status: 500 }
    );
  }
}