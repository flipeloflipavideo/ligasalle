import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// Función para subir imagen a Cloudinary
export async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'team-shields',
        public_id: filename,
        transformation: [
          { width: 200, height: 200, crop: 'fill' },
          // Redimensionar a 200x200
          { quality: 'auto' }, // Optimizar calidad automáticamente
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('No se pudo subir la imagen'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

// Función para eliminar imagen de Cloudinary
export async function deleteImage(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}