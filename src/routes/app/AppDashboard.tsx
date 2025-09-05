import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, AlertCircle, QrCode, FileText, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

type StatTile = { title: string; value: string; icon: any; color: string; bgColor: string };

type BladeItem = {
  id: string;
  blade_code: string;
  status: string | null;
  machine: string | null;
  width_mm: number | null;
  thickness_mm: number | null;
  length_mm: number | null;
  spec: string | null;
};

export const AppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatTile[]>([
    { title: 'Moje ostrza', value: '—', icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { title: 'Oczekujące zwroty', value: '—', icon: Clock, color: 'text-warning-600', bgColor: 'bg-warning-50' },
    { title: 'Przekroczenia', value: '—', icon: AlertCircle, color: 'text-error-600', bgColor: 'bg-error-50' },
  ]);
  const [blades, setBlades] = useState<BladeItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!profile?.client_id) { 
          setLoading(false); 
          return; 
        }

        // Load blades for this client
        const { data: bladesData, error: bErr } = await supabase
          .from('blades')
          .select('id, blade_code, status, machine, width_mm, thickness_mm, length_mm, spec')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false });
        
        if (bErr) throw bErr;

        const bladesArray = bladesData ?? [];
        
        // Calculate stats
        const total = bladesArray.length;
        const needsAttention = bladesArray.filter(b => {
          const status = b.status ?? 'c0';
          return ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14'].includes(status);
        }).length;
        
        // Get recent movements to estimate pending returns
        const ids = bladesArray.map(b => b.id);
        let pendingReturns = 0;
        if (ids.length) {
          const { data: movements } = await supabase
            .from('movements')
            .select('blade_id, op_code')
            .in('blade_id', ids)
            .order('created_at', { ascending: false })
            .limit(100);
          
          // Count blades that have PZ (issued) as last operation
          const lastOps = new Map<string, string>();
          (movements ?? []).forEach(m => {
            if (!lastOps.has(m.blade_id)) {
              lastOps.set(m.blade_id, m.op_code);
            }
          });
          pendingReturns = Array.from(lastOps.values()).filter(op => op === 'PZ').length;
        }

        const tiles: StatTile[] = [
          { title: 'Moje ostrza', value: String(total), icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-50' },
          { title: 'Oczekujące zwroty', value: String(pendingReturns), icon: Clock, color: 'text-warning-600', bgColor: 'bg-warning-50' },
          { title: 'Przekroczenia', value: String(needsAttention), icon: AlertCircle, color: 'text-error-600', bgColor: 'bg-error-50' },
        ];

        if (!cancelled) {
          setStats(tiles);
          setBlades(bladesArray);
        }
      } catch (e) {
        console.error('AppDashboard load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.client_id]);


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Panel Klienta" 
        subtitle={`Witaj, ${user?.email || 'Użytkownik'}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Stats tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map((t, index) => (
            <Card key={t.title} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  {t.title}
                  <div className="ml-2 p-1 rounded-full bg-gray-100">
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-3xl font-semibold">{t.value}</div>
                <div className={`p-2 rounded-xl ${t.bgColor}`}>
                  <t.icon className={`h-6 w-6 ${t.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/scan')}
                className="h-16 bg-primary-600 hover:bg-primary-700 text-white flex flex-col items-center justify-center space-y-2"
              >
                <QrCode className="h-6 w-6" />
                <span className="text-sm font-medium">Skanuj ostrza</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/app/wzpz')}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-300 hover:border-primary-300 hover:bg-primary-50"
              >
                <FileText className="h-6 w-6 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">WZ/PZ</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/app/blades')}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm font-medium">Moje ostrza</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My blades list */}
        <Card>
          <CardHeader>
            <CardTitle>Moje ostrza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p>Ładowanie ostrzy...</p>
                </div>
              ) : blades.slice(0, 3).map((blade) => (
                <div 
                  key={blade.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/blades/${encodeURIComponent(blade.blade_code)}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">Ostrze piły #{blade.blade_code}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Model: {blade.spec || `${blade.width_mm || '—'}×${blade.thickness_mm || '—'}×${blade.length_mm || '—'}mm`}
                    </p>
                    {blade.machine && (
                      <p className="text-sm text-gray-500">Lokalizacja: {blade.machine}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <StatusPill status={(blade.status || 'c0') as any} />
                  </div>
                </div>
              ))}
              
              {blades.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Brak ostrzy</p>
                  <p>Nie masz jeszcze żadnych ostrzy w systemie</p>
                </div>
              )}
              
              {blades.length > 3 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/app/blades')}
                  >
                    Zobacz wszystkie ({blades.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppDashboard;