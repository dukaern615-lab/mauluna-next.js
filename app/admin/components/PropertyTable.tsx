'use client';

import type { Property } from '../page';

interface PropertyTableProps {
  properties: Property[];
  selectedProperties: string[];
  onSelectProperty: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onAction: (action: string, propertyId: string) => void;
  onEdit: (property: Property) => void;
  onManageImages: (property: Property) => void;
  actionLoading?: string | null;
}

export default function PropertyTable({
  properties,
  selectedProperties,
  onSelectProperty,
  onSelectAll,
  onAction,
  onEdit,
  onManageImages,
  actionLoading,
}: PropertyTableProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-700 border-orange-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };

    const labels = {
      pending: 'In Attesa',
      approved: 'Approvato',
      rejected: 'Rifiutato',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Appartamento',
      house: 'Casa',
      office: 'Ufficio',
      commercial: 'Commerciale',
      land: 'Terreno',
      garage: 'Box/Garage',
    };
    return labels[type] || type;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = (propertyId: string, title: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${title}"? Questa azione non può essere annullata.`)) {
      onAction('delete', propertyId);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={properties.length > 0 && selectedProperties.length === properties.length}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-[#D97860] border-gray-300 rounded focus:ring-[#D97860] cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Immagine
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Titolo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Prezzo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <i className="ri-inbox-line text-4xl mb-2"></i>
                  <p>Nessun annuncio trovato</p>
                </td>
              </tr>
            ) : (
              properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.id)}
                      onChange={() => onSelectProperty(property.id)}
                      className="w-4 h-4 text-[#D97860] border-gray-300 rounded focus:ring-[#D97860] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {property.property_images?.[0] ? (
                        <img
                          src={property.property_images[0].image_url}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="ri-image-line text-2xl text-gray-400"></i>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{property.title}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {property.address}, {property.city}
                      </p>
                      {property.featured && (
                        <span className="inline-flex items-center mt-1 text-xs text-[#C9A876]">
                          <i className="ri-star-fill mr-1"></i>
                          In Evidenza
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">
                      {getPropertyTypeLabel(property.property_type)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(property.price)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(property.status)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(property.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {/* Approve */}
                      {property.status !== 'approved' && (
                        <button
                          onClick={() => onAction('approve', property.id)}
                          disabled={actionLoading === property.id}
                          className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Approva"
                        >
                          {actionLoading === property.id ? (
                            <i className="ri-loader-4-line text-lg animate-spin"></i>
                          ) : (
                            <i className="ri-checkbox-circle-line text-lg"></i>
                          )}
                        </button>
                      )}

                      {/* Reject */}
                      {property.status !== 'rejected' && (
                        <button
                          onClick={() => onAction('reject', property.id)}
                          disabled={actionLoading === property.id}
                          className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rifiuta"
                        >
                          {actionLoading === property.id ? (
                            <i className="ri-loader-4-line text-lg animate-spin"></i>
                          ) : (
                            <i className="ri-close-circle-line text-lg"></i>
                          )}
                        </button>
                      )}

                      {/* Toggle Featured */}
                      <button
                        onClick={() => onAction('toggle_featured', property.id)}
                        disabled={actionLoading === property.id}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          property.featured
                            ? 'text-[#C9A876] bg-[#C9A876]/10'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={property.featured ? 'Rimuovi da evidenza' : 'Metti in evidenza'}
                      >
                        {actionLoading === property.id ? (
                          <i className="ri-loader-4-line text-lg animate-spin"></i>
                        ) : (
                          <i className={`text-lg ${property.featured ? 'ri-star-fill' : 'ri-star-line'}`}></i>
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(property)}
                        className="w-8 h-8 flex items-center justify-center text-[#D97860] hover:bg-[#D97860]/10 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>

                      {/* Manage Images */}
                      <button
                        onClick={() => onManageImages(property)}
                        className="w-8 h-8 flex items-center justify-center text-[#C9A876] hover:bg-[#C9A876]/10 rounded-lg transition-colors"
                        title="Gestisci Immagini"
                      >
                        <i className="ri-image-line text-lg"></i>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(property.id, property.title)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}