"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SimpleTest() {
  const [apiStatus, setApiStatus] = useState<string>("No probado");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/simple-test");
      const data = await response.json();
      
      if (response.ok) {
        setApiStatus("✅ Funcionando");
        setApiResponse(data);
      } else {
        setApiStatus("❌ Error");
        setApiResponse(data);
      }
    } catch (error) {
      setApiStatus("❌ Error de conexión");
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPost = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/simple-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Hola desde el frontend", timestamp: new Date().toISOString() }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setApiStatus("✅ POST funcionando");
        setApiResponse(data);
      } else {
        setApiStatus("❌ Error en POST");
        setApiResponse(data);
      }
    } catch (error) {
      setApiStatus("❌ Error de conexión en POST");
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Prueba Simple del Sistema
        </h1>
        <p className="text-lg text-muted-foreground">
          Verificación básica de conexión y funcionalidad
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Verificación de componentes básicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Frontend:</span>
              <Badge variant="secondary">✅ Cargado</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>API:</span>
              <Badge variant={apiStatus.includes("✅") ? "default" : "destructive"}>
                {apiStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Componentes UI:</span>
              <Badge variant="secondary">✅ Funcionando</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pruebas Rápidas</CardTitle>
            <CardDescription>
              Ejecutar pruebas de conexión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testApi} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Probando..." : "Probar GET"}
              </Button>
              <Button 
                onClick={testPost} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? "Probando..." : "Probar POST"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {apiResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Respuesta de la API</CardTitle>
            <CardDescription>
              Última respuesta recibida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>
            Datos básicos de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Framework:</strong> Next.js 15</div>
          <div><strong>Lenguaje:</strong> TypeScript</div>
          <div><strong>Estilos:</strong> Tailwind CSS</div>
          <div><strong>Componentes:</strong> shadcn/ui</div>
          <div><strong>Base de Datos:</strong> Prisma + SQLite</div>
          <div><strong>Estado:</strong> Prueba simple activa</div>
        </CardContent>
      </Card>
    </div>
  );
}