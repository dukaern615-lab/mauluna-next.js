'use client';

import { useState, useRef } from 'react';
import type { Property } from '../page';
import { supabase } from '@/lib/supabaseClient';
import { adminPropertyFunctions } from '@/lib/supabaseFunctions';
import { useToast } from '@/hooks/useToast';

interface ImageManagerProps {
  property: Property;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ImageManager({ property, onClose, onUpdate }: ImageManagerProps) {
  const toast = useToast();
  const [images, setImages] = useState(property.property_images || []);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${property.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        // Add to database using Edge Function
        await adminPropertyFunctions.addImage(property.id, {
          url: publicUrl,
          isPrimary: images.length === 0,
          displayOrder: images.length,
        });
      }

      onUpdate();
      
      // Refresh images via Edge Function
      const { propertyFunctions } = await import('@/lib/supabaseFunctions');
      const updatedProperty = await propertyFunctions.get({ id: property.id });
      const propertyData = Array.isArray(updatedProperty) ? updatedProperty[0] : updatedProperty;
      
      if (propertyData && propertyData.property_images) {
        setImages(propertyData.property_images);
        toast.success('Immagini caricate con successo');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Errore durante il caricamento delle immagini. Riprova.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return;

    setProcessing(true);

    try {
      // Delete image from database using Edge Function
      await adminPropertyFunctions.deleteImage(property.id, {
        url: imageUrl,
        imageId: imageId,
      });

      // Delete image from storage if it's in Supabase storage
      if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from('property-images')
          .remove([fileName]);
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      onUpdate();
      toast.success('Immagine eliminata con successo');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Errore durante l\'eliminazione dell\'immagine. Riprova.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setProcessing(true);

    try {
      // Set primary image using Edge Function
      await adminPropertyFunctions.setPrimaryImage(property.id, {
        imageId: imageId,
      });

      setImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      })));
      onUpdate();
      toast.success('Immagine principale impostata');
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Errore durante l\'impostazione dell\'immagine principale. Riprova.');
    } finally {
      setProcessing(false);
    }
  };

  const handleMoveUp = async (imageId: string, currentOrder: number) => {
    if (currentOrder === 0) return;
    
    setProcessing(true);
    try {
      const targetOrder = currentOrder - 1;
      const targetImage = images.find(img => img.display_order === targetOrder);
      
      if (targetImage) {
        // Swap orders
        await supabase
          .from('property_images')
          .update({ display_order: targetOrder })
          .eq('id', imageId);
          
        await supabase
          .from('property_images')
          .update({ display_order: currentOrder })
          .eq('id', targetImage.id);
      } else {
        // Just update this image's order
        await supabase
          .from('property_images')
          .update({ display_order: targetOrder })
          .eq('id', imageId);
      }
      
      // Refresh images via Edge Function
      const { propertyFunctions } = await import('@/lib/supabaseFunctions');
      const updatedProperty = await propertyFunctions.get({ id: property.id });
      const propertyData = Array.isArray(updatedProperty) ? updatedProperty[0] : updatedProperty;
      
      if (propertyData && propertyData.property_images) {
        setImages(propertyData.property_images);
      }
      onUpdate();
    } catch (error) {
      console.error('Error moving image up:', error);
      toast.error('Errore durante lo spostamento dell\'immagine');
    } finally {
      setProcessing(false);
    }
  };

  const handleMoveDown = async (imageId: string, currentOrder: number) => {
    const maxOrder = Math.max(...images.map(img => img.display_order || 0));
    if (currentOrder >= maxOrder) return;
    
    setProcessing(true);
    try {
      const targetOrder = currentOrder + 1;
      const targetImage = images.find(img => img.display_order === targetOrder);
      
      if (targetImage) {
        // Swap orders
        await supabase
          .from('property_images')
          .update({ display_order: targetOrder })
          .eq('id', imageId);
          
        await supabase
          .from('property_images')
          .update({ display_order: currentOrder })
          .eq('id', targetImage.id);
      } else {
        // Just update this image's order
        await supabase
          .from('property_images')
          .update({ display_order: targetOrder })
          .eq('id', imageId);
      }
      
      // Refresh images via Edge Function
      const { propertyFunctions } = await import('@/lib/supabaseFunctions');
      const updatedProperty = await propertyFunctions.get({ id: property.id });
      const propertyData = Array.isArray(updatedProperty) ? updatedProperty[0] : updatedProperty;
      
      if (propertyData && propertyData.property_images) {
        setImages(propertyData.property_images);
      }
      onUpdate();
    } catch (error) {
      console.error('Error moving image down:', error);
      toast.error('Errore durante lo spostamento dell\'immagine');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestisci Immagini</h2>
            <p className="text-sm text-gray-600 mt-1">{property.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Section */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || processing}
              className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#D97860] hover:bg-[#D97860]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <i className="ri-loader-4-line text-xl animate-spin"></i>
                  <span>Caricamento in corso...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <i className="ri-upload-cloud-line text-2xl"></i>
                  <span>Clicca per caricare nuove immagini</span>
                </div>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Puoi selezionare più immagini contemporaneamente
            </p>
          </div>

          {/* Images Grid */}
          {images.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-image-line text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Nessuna immagine caricata</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                .map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#D97860] transition-colors"
                  >
                    {/* Image */}
                    <img
                      src={image.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Badge */}
                    {image.is_primary && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#C9A876] text-white text-xs font-medium rounded">
                        <i className="ri-star-fill mr-1"></i>
                        Principale
                      </div>
                    )}

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleMoveUp(image.id, image.display_order || 0)}
                        disabled={processing || (image.display_order || 0) === 0}
                        className="w-10 h-10 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Sposta su"
                      >
                        <i className="ri-arrow-up-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => handleMoveDown(image.id, image.display_order || 0)}
                        disabled={processing || (image.display_order || 0) >= Math.max(...images.map(img => img.display_order || 0))}
                        className="w-10 h-10 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Sposta giù"
                      >
                        <i className="ri-arrow-down-line text-lg"></i>
                      </button>
                      {!image.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(image.id)}
                          disabled={processing}
                          className="w-10 h-10 bg-white text-[#C9A876] rounded-lg hover:bg-[#C9A876] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Imposta come principale"
                        >
                          <i className="ri-star-line text-lg"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(image.id, image.image_url)}
                        disabled={processing}
                        className="w-10 h-10 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Elimina"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <i className="ri-information-line text-blue-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Suggerimenti:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>L'immagine principale verrà mostrata come anteprima dell'annuncio</li>
                  <li>Carica immagini di alta qualità per attirare più visitatori</li>
                  <li>Consigliamo almeno 5-10 immagini per annuncio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C86850] transition-colors whitespace-nowrap"
          >
            <i className="ri-check-line mr-2"></i>
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
}