'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { whatsappLeadsFunctions } from '@/lib/supabaseFunctions';

interface WhatsAppLead {
  id: string;
  user_id: string | null;
  phone_number: string | null;
  property_id: string | null;
  context: string;
  message_preview: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
  contacted: boolean;
  contacted_at: string | null;
  notes: string | null;
  property?: {
    id: string;
    title: string;
    zone: string;
  } | null;
  user?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export default function WhatsAppLeads() {
  const toast = useToast();
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterContacted, setFilterContacted] = useState<'all' | 'contacted' | 'not_contacted'>('all');
  const [filterContext, setFilterContext] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLead, setSelectedLead] = useState<WhatsAppLead | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterContacted === 'contacted') {
        filters.contacted = true;
      } else if (filterContacted === 'not_contacted') {
        filters.contacted = false;
      }
      if (filterContext !== 'all') {
        filters.context = filterContext;
      }
      if (dateFrom) {
        filters.dateFrom = dateFrom;
      }
      if (dateTo) {
        filters.dateTo = dateTo;
      }

      const data = await whatsappLeadsFunctions.getLeads(filters);
      setLeads(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Errore nel caricamento dei lead WhatsApp');
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filterContacted, filterContext, dateFrom, dateTo, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleMarkContacted = async (leadId: string, contacted: boolean) => {
    setUpdating(true);
    try {
      await whatsappLeadsFunctions.updateLead(leadId, { contacted });
      toast.success(contacted ? 'Lead segnato come contattato' : 'Lead segnato come non contattato');
      fetchLeads();
    } catch (error: any) {
      toast.error('Errore nell\'aggiornamento del lead');
      console.error('Error updating lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      await whatsappLeadsFunctions.updateLead(selectedLead.id, { notes });
      toast.success('Note salvate');
      setShowNotesModal(false);
      fetchLeads();
    } catch (error: any) {
      toast.error('Errore nel salvataggio delle note');
      console.error('Error saving notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo lead?')) return;
    setUpdating(true);
    try {
      await whatsappLeadsFunctions.deleteLead(leadId);
      toast.success('Lead eliminato');
      fetchLeads();
    } catch (error: any) {
      toast.error('Errore nell\'eliminazione del lead');
      console.error('Error deleting lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const openNotesModal = (lead: WhatsAppLead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || '');
    setShowNotesModal(true);
  };

  const contextLabels: { [key: string]: string } = {
    property_contact: 'Contatto Proprietà',
    property_card: 'Card Proprietà',
    share: 'Condivisione',
    footer: 'Footer',
    contact_page: 'Pagina Contatti',
    add_listing: 'Aggiungi Annuncio',
    home_page_publish: 'Home - Pubblica',
    home_page_question: 'Home - Domanda',
    about_page_owner: 'Chi Siamo - Proprietario',
    about_page_user: 'Chi Siamo - Utente',
  };

  const uniqueContexts = Array.from(new Set(leads.map(l => l.context)));

  const stats = {
    total: leads.length,
    contacted: leads.filter(l => l.contacted).length,
    notContacted: leads.filter(l => !l.contacted).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lead WhatsApp</h2>
          <p className="text-sm text-gray-600 mt-1">Persone che hanno cliccato su WhatsApp ma non hanno inviato il messaggio</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Totale Lead</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700">Contattati</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{stats.contacted}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-700">Da Contattare</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">{stats.notContacted}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
            <select
              value={filterContacted}
              onChange={(e) => setFilterContacted(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
            >
              <option value="all">Tutti</option>
              <option value="not_contacted">Da Contattare</option>
              <option value="contacted">Contattati</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contesto</label>
            <select
              value={filterContext}
              onChange={(e) => setFilterContext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
            >
              <option value="all">Tutti</option>
              {uniqueContexts.map(ctx => (
                <option key={ctx} value={ctx}>{contextLabels[ctx] || ctx}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Da Data</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">A Data</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <i className="ri-loader-4-line text-3xl text-gray-400 animate-spin"></i>
            <p className="text-gray-600 mt-2">Caricamento lead...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <i className="ri-whatsapp-line text-4xl text-gray-300 mb-2"></i>
            <p className="text-gray-600">Nessun lead trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contesto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Utente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Proprietà</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Messaggio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stato</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(lead.created_at).toLocaleString('it-IT')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {contextLabels[lead.context] || lead.context}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lead.user ? (
                        <div>
                          <div className="font-medium">{lead.user.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{lead.user.email}</div>
                        </div>
                      ) : lead.phone_number ? (
                        <div className="font-medium">{lead.phone_number}</div>
                      ) : (
                        <span className="text-gray-400">Anonimo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lead.property ? (
                        <div>
                          <div className="font-medium">{lead.property.title}</div>
                          <div className="text-xs text-gray-500">{lead.property.zone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                      <div className="truncate" title={lead.message_preview || ''}>
                        {lead.message_preview || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lead.contacted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.contacted ? 'Contattato' : 'Da Contattare'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkContacted(lead.id, !lead.contacted)}
                          disabled={updating}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            lead.contacted
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } transition-colors disabled:opacity-50`}
                        >
                          {lead.contacted ? 'Non Contattato' : 'Contattato'}
                        </button>
                        <button
                          onClick={() => openNotesModal(lead)}
                          className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          Note
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={updating}
                          className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Note Lead</h3>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                  <i className="ri-close-line text-xl text-gray-600"></i>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Data:</strong> {new Date(selectedLead.created_at).toLocaleString('it-IT')}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Contesto:</strong> {contextLabels[selectedLead.context] || selectedLead.context}
                </div>
                {selectedLead.property && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Proprietà:</strong> {selectedLead.property.title}
                  </div>
                )}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent resize-none"
                placeholder="Aggiungi note su questo lead..."
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-4 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors disabled:opacity-50"
              >
                {updating ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}