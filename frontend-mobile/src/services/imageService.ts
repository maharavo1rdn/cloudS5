import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

class ImageService {
  private readonly IMAGES_PATH = 'points_images';

  /**
   * Upload une ou plusieurs images vers Firebase Storage
   * @param pointId ID du point (signalement)
   * @param images Tableau de fichiers (File ou Blob)
   * @returns Array d'URLs Firebase Storage
   */
  async uploadImages(pointId: string, images: (File | Blob)[]): Promise<string[]> {
    try {
      const uploadPromises = images.map(async (image, index) => {
        const timestamp = Date.now();
        const fileName = `${pointId}_${timestamp}_${index}`;
        const storageRef = ref(storage, `${this.IMAGES_PATH}/${pointId}/${fileName}`);
        
        await uploadBytes(storageRef, image);
        const downloadURL = await getDownloadURL(storageRef);
        
        console.log(`✅ Image uploadée: ${downloadURL}`);
        return downloadURL;
      });

      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('❌ Erreur upload images:', error);
      throw new Error('Impossible d\'uploader les images');
    }
  }

  /**
   * Supprimer une image de Firebase Storage
   * @param imageUrl URL complète de l'image Firebase
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log(`✅ Image supprimée: ${imageUrl}`);
    } catch (error) {
      console.error('❌ Erreur suppression image:', error);
      throw new Error('Impossible de supprimer l\'image');
    }
  }

  /**
   * Convertir un data URL (depuis camera) en Blob
   * @param dataUrl Data URL (base64)
   * @returns Blob
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Compresser une image (optionnel, pour réduire la taille)
   * @param file Fichier image
   * @param maxWidth Largeur max
   * @param quality Qualité (0-1)
   * @returns Blob compressé
   */
  async compressImage(file: File | Blob, maxWidth = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Compression échouée'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  }
}

export default new ImageService();
