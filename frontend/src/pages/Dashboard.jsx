import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminSummary, getAdminUsers, getAdminProjects } from "../api/adminApi";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler, Title
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler, Title);

const palette = ["#6366F1","#10B981","#F59E0B","#EF4444","#3B82F6","#8B5CF6","#14B8A6"];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [s, u, p] = await Promise.all([
          getAdminSummary(),
          getAdminUsers({ page: 1, limit: 10 }),
          getAdminProjects({ page: 1, limit: 10 }),
        ]);
        if (!mounted) return;
        setSummary(s || null);
        setUsers(Array.isArray(u?.rows) ? u.rows : Array.isArray(u?.data) ? u.data : []);
        setProjects(Array.isArray(p?.rows) ? p.rows : Array.isArray(p?.data) ? p.data : []);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data?.message || "Failed to load admin data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const createdVsCompleted = useMemo(() => {
    const c = summary?.charts?.createdByDay || [];
    const d = summary?.charts?.completedByDay || [];
    const map = {};
    c.forEach(x => x?.date && (map[x.date] = { date: x.date, created: x.created || 0, completed: 0 }));
    d.forEach(x => x?.date && (map[x.date] = { ...(map[x.date] || { date: x.date, created: 0 }), completed: x.completed || 0 }));
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
  }, [summary]);

  const throughputData = useMemo(() => {
    if (!createdVsCompleted.length) return null;
    return {
      labels: createdVsCompleted.map(d => d.date),
      datasets: [
        { label: "Created", data: createdVsCompleted.map(d => d.created), tension: 0.35, fill: true,
          borderColor: palette[0], backgroundColor: palette[0] + "33", pointRadius: 2, borderWidth: 2 },
        { label: "Completed", data: createdVsCompleted.map(d => d.completed), tension: 0.35, fill: true,
          borderColor: palette[1], backgroundColor: palette[1] + "33", pointRadius: 2, borderWidth: 2 },
      ],
    };
  }, [createdVsCompleted]);

  const tasksByStatusData = useMemo(() => {
    const rows = summary?.breakdowns?.tasksByStatus || [];
    if (!rows.length) return null;
    const labels = rows.map(s => s?.status || "unknown");
    const values = rows.map(s => s?.count || 0);
    return { labels, datasets: [{ label: "Tasks", data: values, borderWidth: 1,
      backgroundColor: labels.map((_, i) => palette[i % palette.length]) }] };
  }, [summary]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // important for our height classes
    plugins: { legend: { labels: { color: "#fff" } }, tooltip: { mode: "index", intersect: false } },
    scales: {
      x: { ticks: { color: "#ccc" }, grid: { color: "#444" } },
      y: { beginAtZero: true, ticks: { color: "#ccc", precision: 0 }, grid: { color: "#444" } },
    },
  };

  return (
    <div className="min-h-screen bg-[#0b0b13] p-6 pb-10 space-y-8">
      <h1 className="text-3xl font-bold text-white">Welcome, {user?.name || "User"}!</h1>

      {err && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-2">
          {err}
        </div>
      )}

      {loading && <div className="text-gray-300">Loading dashboard…</div>}

      {!loading && summary && (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Users" value={summary?.totals?.users ?? 0} />
            <KpiCard label="Projects" value={summary?.totals?.projects ?? 0} />
            <KpiCard label="Tasks" value={summary?.totals?.tasks ?? 0} />
            <KpiCard label="Active (7d)" value={summary?.kpis?.activeUsers7d ?? 0} />
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Throughput (14 days)">
              <div className="h-56 sm:h-64 md:h-72 lg:h-80">
                {throughputData ? <Line data={throughputData} options={commonOptions} /> : <Empty />}
              </div>
            </Card>

            <Card title="Tasks by Status">
              <div className="h-56 sm:h-64 md:h-72 lg:h-80">
                {tasksByStatusData ? <Bar data={tasksByStatusData} options={commonOptions} /> : <Empty />}
              </div>
            </Card>
          </section>
        </>
      )}

      {/* Tables */}
      {!loading && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Recent Users">
            <SimpleTable
              columns={["Name","Email","Role"]}
              rows={(users||[]).map(u=>[u?.name||"-",u?.email||"-",u?.role||"-"])}
            />
          </Card>

          <Card title="Projects (Top)">
            <SimpleTable
              columns={["Name","PM","Tasks","Done"]}
              rows={(projects||[]).map(p=>[
                p?.name||"-",
                p?.projectManager?.name||"-",
                p?.totalTasks??0,
                p?.doneTasks??0,
              ])}
            />
          </Card>
        </section>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-[#121A29] rounded-2xl p-4 border border-[#1f2a3a]">
      <h3 className="font-medium text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-[#121A29] rounded-2xl p-4 border border-[#1f2a3a]">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SimpleTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-white">
        <thead className="text-gray-300">
          <tr>{columns.map(c => <th key={c} className="py-2 pr-4">{c}</th>)}</tr>
        </thead>
        <tbody>
          {(!rows || rows.length === 0) && (
            <tr>
              <td className="py-3 pr-4 text-gray-400" colSpan={columns.length}>No data</td>
            </tr>
          )}
          {rows.map((r,i)=>(
            <tr key={i} className="border-t border-[#1f2a3a]">
              {r.map((cell,j)=><td key={j} className="py-2 pr-4">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty(){
  return <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">No data</div>;
}
