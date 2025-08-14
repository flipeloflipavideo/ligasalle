import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");

    const holidays = await db.holiday.findMany({
      where: seasonId ? { seasonId } : {},
      include: {
        season: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { error: "Error fetching holidays" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      seasonId,
      name,
      startDate,
      endDate,
      description,
    } = body;

    // Validaciones básicas
    if (!seasonId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convertir fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validar que la fecha de fin sea posterior a la de inicio
    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
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

    // Crear el período vacacional
    const holiday = await db.holiday.create({
      data: {
        seasonId,
        name,
        startDate: start,
        endDate: end,
        description: description || null,
      },
      include: {
        season: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json(
      { error: "Error creating holiday" },
      { status: 500 }
    );
  }
}