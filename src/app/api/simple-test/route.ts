import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Respuesta simple y rápida
    return NextResponse.json({
      status: 'ok',
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Error en prueba simple:', error);
    return NextResponse.json(
      { error: 'Error en la prueba' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simplemente devolver lo que recibimos para probar el POST
    return NextResponse.json({
      status: 'ok',
      message: 'POST recibido correctamente',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en POST simple:', error);
    return NextResponse.json(
      { error: 'Error en el POST' },
      { status: 500 }
    );
  }
}