import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/common/PageHeader';

import { supabase } from '../../lib/supabase';
import useAuth from '../../hooks/useAuth';
import { useNotify } from '../../lib/notify';

type DocType = 'WZ' | 'PZ';
type DocStatus = 'open' | 'closed';

type DocRow = {
  id: string;
  type: DocType;
  client_id: string;
  human_id: string;
  status: DocStatus;
  created_at: string;
  created_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
};

const SELECT = 'id,type,client_id,human_id,status,created_at,created_by,closed_at,closed_by';

export default function ClientWZPZ() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const { error } = useNotify();

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(d => d.human_id.toLowerCase().includes(q));
  }, [docs, filter]);

  const loadDocs = useCallback(async () => {
    if (!profile?.client_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: de } = await supabase
        .from('wzpz_docs')
        .select(SELECT)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false });
      if (de) throw de;
      setDocs((data ?? []) as DocRow[]);
    } catch (e) {
      console.error('ClientWZPZ load error', e);
      error('Nie udało się wczytać dokumentów');
    } finally {
      setLoading(false);
    }
  }, [profile?.client_id, error]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadDocs();
  }, [loadDocs]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dokumenty WZ/PZ" 
        subtitle="Twoje dokumenty wydania i przyjęcia"
        showBack 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader><CardTitle>Wyszukiwanie</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Szukaj</Label>
              <Input 
                placeholder="Numer dokumentu…" 
                value={filter} 
                onChange={e => setFilter(e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <span>Lista dokumentów ({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numer</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data utworzenia</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">Ładowanie…</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      {filter ? 'Brak dokumentów spełniających kryteria' : 'Brak dokumentów'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => nav(`/app/wzpz/${d.id}`)}
                    >
                      <TableCell className="font-medium">{d.human_id}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.type === 'WZ' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-cyan-50 text-cyan-700'
                        }`}>
                          {d.type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {d.status === 'open' ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            Otwarte
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            Zamknięte
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            nav(`/app/wzpz/${d.id}`); 
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Podgląd
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}