import { supabase } from './supabase';

export interface UploadImageResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload an image file to the 'restaurant-assets' Supabase storage bucket
 */
export async function uploadImage(
  file: File,
  folder: 'logos' | 'rewards',
  restaurantId: string
): Promise<UploadImageResult> {
  try {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { url: null, error: 'Format non supporté. Veuillez choisir une image PNG, JPG, WebP ou SVG.' };
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, error: 'Le fichier dépasse la taille maximale autorisée (5 Mo).' };
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const cleanFileName = `${restaurantId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Erreur Supabase Storage:', uploadError);
      
      // If the bucket doesn't exist yet, provide helpful message
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
        return { 
          url: null, 
          error: "Le bucket 'restaurant-assets' n'est pas encore créé dans Supabase Storage. Veuillez exécuter le script SQL ou créer le bucket public." 
        };
      }
      
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage
      .from('restaurant-assets')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (err: any) {
    console.error('Unexpected upload error:', err);
    return { url: null, error: err.message || "Erreur inattendue lors de l'upload de l'image." };
  }
}
