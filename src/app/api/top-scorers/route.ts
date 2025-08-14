import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get("sportType");
    const ageCategory = searchParams.get("ageCategory");

    if (!sportType) {
      return NextResponse.json(
        { error: "Sport type is required" },
        { status: 400 }
      );
    }

    // Construir el filtro
    const whereClause: any = {
      result: {
        match: {
          league: {
            sportType: sportType as any,
          },
        },
      },
    };

    if (ageCategory) {
      whereClause.result.match.league.ageCategory = ageCategory;
    }

    // Obtener los mejores anotadores
    const topScorers = await db.goal.groupBy({
      by: ["playerId"],
      where: whereClause,
      _count: {
        playerId: true,
      },
      orderBy: {
        _count: {
          playerId: "desc",
        },
      },
      take: 20, // Limitar a los 20 mejores
    });

    // Obtener información detallada de los jugadores
    const playerIds = topScorers.map((scorer) => scorer.playerId);
    const players = await db.player.findMany({
      where: {
        id: { in: playerIds },
      },
      include: {
        team: {
          include: {
            league: {
              include: {
                season: true,
              },
            },
          },
        },
      },
    });

    // Combinar la información
    const topScorersWithDetails = topScorers.map((scorer) => {
      const player = players.find((p) => p.id === scorer.playerId);
      return {
        playerId: scorer.playerId,
        playerName: player?.name || "Unknown",
        teamName: player?.team?.name || "Unknown",
        teamColor: player?.team?.color || "#000000",
        goals: scorer._count.playerId,
        leagueName: player?.team?.league?.name || "Unknown",
        ageCategory: player?.team?.league?.ageCategory || "Unknown",
        sportType: player?.team?.league?.sportType || "Unknown",
      };
    });

    // Agrupar por categoría de edad si no se especifica una
    if (!ageCategory) {
      const groupedByCategory: { [key: string]: typeof topScorersWithDetails } = {};
      
      topScorersWithDetails.forEach((scorer) => {
        if (!groupedByCategory[scorer.ageCategory]) {
          groupedByCategory[scorer.ageCategory] = [];
        }
        groupedByCategory[scorer.ageCategory].push(scorer);
      });

      return NextResponse.json(groupedByCategory);
    }

    return NextResponse.json(topScorersWithDetails);
  } catch (error) {
    console.error("Error fetching top scorers:", error);
    return NextResponse.json(
      { error: "Error fetching top scorers" },
      { status: 500 }
    );
  }
}