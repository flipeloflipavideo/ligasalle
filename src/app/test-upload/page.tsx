"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, X } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

export default function TestUploadPage() {
  const [testImageUrl, setTestImageUrl] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleImageUpload = (url: string) => {
    setTestImageUrl(url);
    setUploadStatus("¡Imagen subida correctamente!");
  };

  const handleImageRemove = () => {
    setTestImageUrl("");
    setUploadStatus("Imagen eliminada");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Prueba de Subida de Imágenes
          </h1>
          <p className="text-lg text-gray-600">
            Esta página permite probar la funcionalidad de subida de escudos para equipos
          </p>
        </div>

        {/* Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Componente ImageUpload
            </CardTitle>
            <CardDescription>
              Prueba el componente de subida de imágenes que se usa en el formulario de equipos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ImageUpload
                currentImage={testImageUrl}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                teamName="Equipo de Prueba"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Section */}
        {uploadStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testImageUrl ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                Estado de la Subida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{uploadStatus}</p>
              {testImageUrl && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">URL de la imagen:</h4>
                    <code className="block p-3 bg-gray-100 rounded text-sm break-all">
                      {testImageUrl}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Vista previa:</h4>
                    <img
                      src={testImageUrl}
                      alt="Imagen subida"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Haz clic en el botón "Subir escudo" en el componente azul</li>
              <li>Selecciona una imagen de tu computadora (JPG, PNG, GIF, máximo 5MB)</li>
              <li>Espera a que se suba la imagen a Cloudinary</li>
              <li>Verifica que aparezca la vista previa y el mensaje de éxito</li>
              <li>Puedes probar cambiar la imagen o eliminarla usando los botones correspondientes</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}