import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SportType, AgeCategory } from "@prisma/client";

export async function GET() {
  try {
    const leagues = await db.league.findMany({
      include: {
        season: true,
        teams: true,
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leagues);
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return NextResponse.json(
      { error: "Error fetching leagues" },
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
      sportType,
      ageCategory,
      seasonId,
      maxTeams,
    } = body;

    // Validaciones básicas
    if (!name || !sportType || !ageCategory || !seasonId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verificar que la temporada existe
    const season = await db.season.findUnique({
      where: { id: seasonId },
    });

    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    // Crear la liga
    const league = await db.league.create({
      data: {
        name,
        description,
        sportType: sportType as SportType,
        ageCategory: ageCategory as AgeCategory,
        seasonId,
        maxTeams: maxTeams ? parseInt(maxTeams) : null,
      },
      include: {
        season: true,
        teams: true,
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error("Error creating league:", error);
    return NextResponse.json(
      { error: "Error creating league" },
      { status: 500 }
    );
  }
}