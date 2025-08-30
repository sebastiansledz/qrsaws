import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PageHeader } from '../../components/common/PageHeader';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

type StatTile = { title: string; value: string; icon: any; color: string; bgColor: string };

export const AppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatTile[]>([
    { title: 'Moje ostrza', value: '—', icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { title: 'Oczekujące zwroty', value: '—', icon: Clock, color: 'text-warning-600', bgColor: 'bg-warning-50' },
    { title: 'Ostrza wymagające uwagi', value: '—', icon: AlertCircle, color: 'text-error-600', bgColor: 'bg-error-50' },
  ]);
  const [recent, setRecent] = useState<Array<{ at: Date; op: string; code: string; stateCode: string | null }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!profile?.client_id) { setLoading(false); return; }

        // blades of this client
        const { data: blades, error: bErr } = await supabase
          .from('blades')
          .select('id, blade_code, status')
          .eq('client_id', profile.client_id);
        if (bErr) throw bErr;

        const ids = (blades ?? []).map(b => b.id);
        let latest: any[] = [];
        if (ids.length) {
          const { data: mv, error: mErr } = await supabase
            .from('movements')
            .select('blade_id, created_at, op_code, state_code')
            .in('blade_id', ids)
            .order('created_at', { ascending: false })
            .limit(100);
          if (mErr) throw mErr;
          latest = mv ?? [];
        }

        // stats
        const total = blades?.length ?? 0;
        const attention = (blades ?? []).filter(b => (b.status ?? 'c0') !== 'c0').length;
        const pendingReturns = latest.filter(r => r.op_code === 'PZ').length; // proxy

        const tiles: StatTile[] = [
          { title: 'Moje ostrza', value: String(total), icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-50' },
          { title: 'Oczekujące zwroty', value: String(pendingReturns), icon: Clock, color: 'text-warning-600', bgColor: 'bg-warning-50' },
          { title: 'Ostrza wymagające uwagi', value: String(attention), icon: AlertCircle, color: 'text-error-600', bgColor: 'bg-error-50' },
        ];

        const byId = new Map((blades ?? []).map(b => [b.id, b.blade_code as string]));
        const recent6 = latest.slice(0, 6).map((r) => ({
          at: new Date(r.created_at),
          op: r.op_code,
          code: byId.get(r.blade_id) ?? r.blade_id,
          stateCode: r.state_code ?? null,
        }));

        if (!cancelled) {
          setStats(tiles);
          setRecent(recent6);
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
      <PageHeader title="Panel Klienta" subtitle="Pulpit" />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((t) => (
          <Card key={t.title} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t.title}</CardTitle>
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

      {/* Recent activity */}
      <Card>
        <CardHeader><CardTitle>Ostatnia aktywność</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!recent.length && !loading && <div className="text-gray-500">Brak aktywności</div>}
          {recent.map((r, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{r.at.toLocaleString()}</div>
              <div className="text-sm font-medium">{r.op}</div>
              <div className="text-sm">{r.code}</div>
              <div className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-1">{r.stateCode ?? '—'}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppDashboard;
