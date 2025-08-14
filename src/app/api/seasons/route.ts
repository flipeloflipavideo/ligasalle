import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const seasons = await db.season.findMany({
      include: {
        leagues: {
          include: {
            _count: {
              select: {
                teams: true,
                matches: true,
              },
            },
          },
        },
        holidays: true,
        _count: {
          select: {
            leagues: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return NextResponse.json(
      { error: "Error fetching seasons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      startDate,
      endDate,
      isActive,
      isMain,
      schoolYear,
    } = body;

    // Validaciones básicas
    if (!name || !startDate || !endDate) {
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

    // Si se marca como activa, desactivar las demás temporadas
    if (isActive) {
      await db.season.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Si se marca como principal, desmarcar las demás
    if (isMain) {
      await db.season.updateMany({
        where: { isMain: true },
        data: { isMain: false },
      });
    }

    // Crear la temporada
    const season = await db.season.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive: isActive !== undefined ? isActive : true,
        isMain: isMain !== undefined ? isMain : false,
        schoolYear: schoolYear || null,
      },
      include: {
        leagues: true,
      },
    });

    // Si es la temporada principal, crear automáticamente las 6 ligas
    if (isMain) {
      const leaguesData = [
        // Ligas de Fútbol
        {
          name: "Liga de Fútbol 1°-2° Grado",
          description: "Liga de fútbol para alumnos de 1° y 2° grado",
          sportType: "FOOTBALL",
          ageCategory: "GRADE_1_2",
          maxTeams: 6,
          seasonId: season.id,
        },
        {
          name: "Liga de Fútbol 3°-4° Grado",
          description: "Liga de fútbol para alumnos de 3° y 4° grado",
          sportType: "FOOTBALL",
          ageCategory: "GRADE_3_4",
          maxTeams: 6,
          seasonId: season.id,
        },
        {
          name: "Liga de Fútbol 5°-6° Grado",
          description: "Liga de fútbol para alumnos de 5° y 6° grado",
          sportType: "FOOTBALL",
          ageCategory: "GRADE_5_6",
          maxTeams: 6,
          seasonId: season.id,
        },
        // Ligas de Baloncesto
        {
          name: "Liga de Baloncesto 1°-2° Grado",
          description: "Liga de baloncesto para alumnos de 1° y 2° grado",
          sportType: "BASKETBALL",
          ageCategory: "GRADE_1_2",
          maxTeams: 6,
          seasonId: season.id,
        },
        {
          name: "Liga de Baloncesto 3°-4° Grado",
          description: "Liga de baloncesto para alumnos de 3° y 4° grado",
          sportType: "BASKETBALL",
          ageCategory: "GRADE_3_4",
          maxTeams: 6,
          seasonId: season.id,
        },
        {
          name: "Liga de Baloncesto 5°-6° Grado",
          description: "Liga de baloncesto para alumnos de 5° y 6° grado",
          sportType: "BASKETBALL",
          ageCategory: "GRADE_5_6",
          maxTeams: 6,
          seasonId: season.id,
        },
      ];

      await db.league.createMany({
        data: leaguesData,
      });

      // Crear vacaciones por defecto para la temporada principal
      const currentYear = new Date().getFullYear();
      const holidaysData = [
        {
          name: "Vacaciones de Navidad",
          startDate: new Date(currentYear, 11, 20), // 20 de diciembre
          endDate: new Date(currentYear + 1, 0, 7), // 7 de enero
          description: "Periodo de vacaciones navideñas",
          seasonId: season.id,
        },
        {
          name: "Semana Santa",
          startDate: new Date(currentYear + 1, 2, 20), // 20 de marzo (aproximado)
          endDate: new Date(currentYear + 1, 3, 5), // 5 de abril (aproximado)
          description: "Periodo de Semana Santa",
          seasonId: season.id,
        },
      ];

      await db.holiday.createMany({
        data: holidaysData,
      });

      // Recargar la temporada con las ligas creadas
      const updatedSeason = await db.season.findUnique({
        where: { id: season.id },
        include: {
          leagues: {
            include: {
              _count: {
                select: {
                  teams: true,
                  matches: true,
                },
              },
            },
          },
          holidays: true,
        },
      });

      return NextResponse.json(updatedSeason, { status: 201 });
    }

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error("Error creating season:", error);
    return NextResponse.json(
      { error: "Error creating season" },
      { status: 500 }
    );
  }
}