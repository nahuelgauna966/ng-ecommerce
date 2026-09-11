import { Inject, Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { UploadApiResponse, v2 as CloudinaryClient } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryClient,
  ) {}

  /**
   * Sube un archivo (memoria, buffer de Multer) a Cloudinary dentro de la
   * carpeta indicada y devuelve la respuesta completa de la API (incluye
   * secure_url y public_id).
   */
  uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary no devolvió un resultado'));
            return;
          }
          resolve(result);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Elimina una imagen de Cloudinary por su public_id (usado al reemplazar
   * la imagen anterior de un producto).
   */
  deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
