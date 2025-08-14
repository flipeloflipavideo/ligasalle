"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Shield } from "lucide-react";

interface ImageUploadProps {
  currentImage?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  teamName: string;
}

export default function ImageUpload({ 
  currentImage, 
  onImageUpload, 
  onImageRemove, 
  teamName 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', teamName);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      onImageUpload(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Por favor intenta nuevamente.');
      setPreviewUrl(currentImage || null); // Revertir preview
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Escudo del Equipo
            </h3>
            {previewUrl && (
              <Badge variant="secondary">Imagen cargada</Badge>
            )}
          </div>

          {/* Preview del escudo */}
          <div className="flex justify-center">
            {previewUrl ? (
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt={`Escudo de ${teamName}`}
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <Shield className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Controles de subida */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex gap-2">
              <Button
                onClick={triggerFileSelect}
                disabled={uploading}
                variant="outline"
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Subiendo...' : previewUrl ? 'Cambiar imagen' : 'Subir escudo'}
              </Button>
              
              {previewUrl && (
                <Button
                  variant="outline"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Quitar
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Formatos: JPG, PNG, GIF. Máximo 5MB. La imagen será redimensionada a 200x200px.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}