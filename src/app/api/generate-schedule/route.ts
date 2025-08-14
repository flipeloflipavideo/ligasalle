import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Función para obtener el offset de la zona horaria local en milisegundos
function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset() * 60 * 1000;
}

// Función para crear una fecha y hora local correcta
function createLocalDateTime(date: Date, hours: number, minutes: number = 0): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// Función para generar fechas de viernes excluyendo vacaciones
function getFridays(startDate: Date, endDate: Date, holidays: Array<{ startDate: Date; endDate: Date }>): Date[] {
  const fridays: Date[] = [];
  const current = new Date(startDate);
  
  // Encontrar el primer viernes
  while (current.getDay() !== 5) {
    current.setDate(current.getDate() + 1);
  }
  
  while (current <= endDate) {
    // Verificar si la fecha actual no está en período vacacional
    const isHoliday = holidays.some(holiday => {
      const holidayStart = new Date(holiday.startDate);
      const holidayEnd = new Date(holiday.endDate);
      return current >= holidayStart && current <= holidayEnd;
    });
    
    if (!isHoliday) {
      // Crear una nueva fecha para el viernes a mediodía (hora local)
      const friday = new Date(current);
      friday.setHours(12, 0, 0, 0); // Mediodía hora local
      fridays.push(friday);
    }
    
    // Avanzar una semana
    current.setDate(current.getDate() + 7);
  }
  
  return fridays;
}

// Función para generar round-robin de una sola vuelta
function generateSingleRoundRobin(teams: string[]): Array<{ home: string; away: string }> {
  const matches: Array<{ home: string; away: string }> = [];
  const n = teams.length;
  
  if (n % 2 !== 0) {
    teams.push("BYE"); // Añadir equipo fantasma para número impar
  }
  
  const totalRounds = teams.length - 1;
  
  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < teams.length / 2; match++) {
      const home = teams[match];
      const away = teams[teams.length - 1 - match];
      
      if (home !== "BYE" && away !== "BYE") {
        matches.push({ home, away });
      }
    }
    
    // Rotar equipos (excepto el primero)
    const first = teams[0];
    const rest = teams.slice(1);
    const rotated = [rest[rest.length - 1], ...rest.slice(0, -1)];
    teams = [first, ...rotated];
  }
  
  return matches;
}

// Función para generar round-robin de ida y vuelta (doble vuelta)
function generateDoubleRoundRobin(teams: string[]): Array<{ home: string; away: string }> {
  const singleRoundMatches = generateSingleRoundRobin([...teams]);
  const doubleRoundMatches = [];
  
  // Primera vuelta
  doubleRoundMatches.push(...singleRoundMatches);
  
  // Segunda vuelta (invertir localía)
  for (const match of singleRoundMatches) {
    doubleRoundMatches.push({ home: match.away, away: match.home });
  }
  
  return doubleRoundMatches;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId } = body;

    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID is required" },
        { status: 400 }
      );
    }

    // Obtener la liga con sus equipos y la temporada
    const league = await db.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        season: {
          include: {
            holidays: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    if (league.teams.length < 2) {
      return NextResponse.json(
        { error: "At least 2 teams are required to generate schedule" },
        { status: 400 }
      );
    }

    // Eliminar partidos existentes de esta liga
    await db.match.deleteMany({
      where: { leagueId },
    });

    // Obtener fechas disponibles (viernes excluyendo vacaciones)
    const fridays = getFridays(
      league.season.startDate,
      league.season.endDate,
      league.season.holidays
    );

    if (fridays.length === 0) {
      return NextResponse.json(
        { error: "No available dates found for matches" },
        { status: 400 }
      );
    }

    // Generar partidos de ida y vuelta (doble vuelta)
    const teamIds = league.teams.map(team => team.id);
    const doubleRoundRobinMatches = generateDoubleRoundRobin(teamIds);

    // Calcular cuántos partidos se pueden jugar por viernes
    const teamsCount = league.teams.length;
    const matchesPerFriday = teamsCount === 4 ? 2 : teamsCount === 6 ? 3 : 1;

    // Organizar partidos en fechas, repitiendo el doble round-robin hasta llenar todos los viernes
    const matchesToCreate = [];
    let roundNumber = 1;
    let fridayIndex = 0;

    // Función para añadir partidos de un doble round-robin completo
    const addDoubleRoundRobin = () => {
      const matchesForThisRound = [...doubleRoundRobinMatches];
      
      while (matchesForThisRound.length > 0 && fridayIndex < fridays.length) {
        const currentFriday = fridays[fridayIndex];
        const fridayMatches = [];
        
        // Añadir partidos para este viernes
        for (let i = 0; i < matchesPerFriday && matchesForThisRound.length > 0; i++) {
          const match = matchesForThisRound.shift();
          
          fridayMatches.push({
            leagueId,
            homeTeamId: match!.home,
            awayTeamId: match!.away,
            matchDate: currentFriday,
            matchTime: createLocalDateTime(currentFriday, 16), // 4:00 PM local time
            location: "Cancha Principal",
            status: "SCHEDULED",
            round: roundNumber,
          });
        }
        
        if (fridayMatches.length > 0) {
          matchesToCreate.push(...fridayMatches);
          roundNumber++;
        }
        
        fridayIndex++;
      }
    };

    // Añadir dobles round-robin hasta llenar todos los viernes disponibles
    while (fridayIndex < fridays.length) {
      addDoubleRoundRobin();
    }

    // Crear los partidos en la base de datos
    const createdMatches = await db.match.createMany({
      data: matchesToCreate,
    });

    // Obtener los partidos creados con información completa
    const matchesWithDetails = await db.match.findMany({
      where: { leagueId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        matchDate: "asc",
      },
    });

    return NextResponse.json({
      message: "Schedule generated successfully",
      totalMatches: createdMatches.count,
      matches: matchesWithDetails,
      fridaysUsed: fridays.length,
      rounds: roundNumber - 1,
    });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json(
      { error: "Error generating schedule" },
      { status: 500 }
    );
  }
}