import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const season = await db.season.findUnique({
      where: { id: params.id },
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
      },
    });

    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(season);
  } catch (error) {
    console.error("Error fetching season:", error);
    return NextResponse.json(
      { error: "Error fetching season" },
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
      startDate,
      endDate,
      isActive,
    } = body;

    // Verificar que la temporada existe
    const existingSeason = await db.season.findUnique({
      where: { id: params.id },
    });

    if (!existingSeason) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Si se marca como activa, desactivar las demás temporadas
    if (isActive) {
      await db.season.updateMany({
        where: { 
          id: { not: params.id },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    // Actualizar la temporada
    const season = await db.season.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: start }),
        ...(endDate && { endDate: end }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        leagues: true,
      },
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error("Error updating season:", error);
    return NextResponse.json(
      { error: "Error updating season" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la temporada existe
    const existingSeason = await db.season.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            leagues: true,
          },
        },
      },
    });

    if (!existingSeason) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    // Verificar si hay ligas asociadas
    if (existingSeason._count.leagues > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete season with associated leagues",
          leaguesCount: existingSeason._count.leagues,
        },
        { status: 400 }
      );
    }

    // Eliminar la temporada
    await db.season.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Season deleted successfully" });
  } catch (error) {
    console.error("Error deleting season:", error);
    return NextResponse.json(
      { error: "Error deleting season" },
      { status: 500 }
    );
  }
}