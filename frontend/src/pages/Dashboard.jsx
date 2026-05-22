import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Chart from 'chart.js/auto';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const doughnutRef = useRef(); const barRef = useRef();
  const chartInstances = useRef({});

  useEffect(() => {
    api.get('/resumes/stats').then(setStats).catch(() => {
      // mock stats if backend not running
      setStats({ total: 142, shortlisted: 48, hired: 12, rejected: 31 });
    });
  }, []);

  useEffect(() => {
    if (!stats) return;

    // Doughnut
    if (chartInstances.current.doughnut) chartInstances.current.doughnut.destroy();
    if (doughnutRef.current) {
      chartInstances.current.doughnut = new Chart(doughnutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Shortlisted','Hired','Rejected','Screened'],
          datasets: [{ data: [stats.shortlisted, stats.hired, stats.rejected,
                              Math.max(0, stats.total - stats.shortlisted - stats.hired - stats.rejected)],
                       backgroundColor: ['#2ab87a','#2a6dd4','#d4562a','#d8d4cb'],
                       borderWidth: 0 }]
        },
        options: { cutout: '68%', plugins: { legend: { position: 'right', labels: { font: { family: 'DM Sans', size: 12 }, boxWidth: 10 } } } }
      });
    }

    // Bar
    if (chartInstances.current.bar) chartInstances.current.bar.destroy();
    if (barRef.current) {
      chartInstances.current.bar = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: ['< 40', '40–59', '60–74', '75–89', '90+'],
          datasets: [{
            label: 'Candidates',
            data: [8, 19, 35, 47, 33],
            backgroundColor: '#0d0d0d',
            borderRadius: 2,
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f0ece4' }, beginAtZero: true }
          }
        }
      });
    }
  }, [stats]);

  if (!stats) return <div className="loading-overlay"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Overview of your recruitment pipeline</div>
        </div>
      </div>

      <div className="stat-grid">
        {[
          { label: 'Total Screened', value: stats.total, chip: 'All time', chipClass: 'chip-blue' },
          { label: 'Shortlisted', value: stats.shortlisted, chip: `${Math.round(stats.shortlisted/stats.total*100)||0}% rate`, chipClass: 'chip-green' },
          { label: 'Hired', value: stats.hired, chip: 'Confirmed', chipClass: 'chip-green' },
          { label: 'Rejected', value: stats.rejected, chip: 'Below threshold', chipClass: 'chip-orange' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <span className={`stat-chip ${s.chipClass}`}>{s.chip}</span>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-box">
          <div className="chart-title">Pipeline Breakdown</div>
          <canvas ref={doughnutRef} height="160" />
        </div>
        <div className="chart-box">
          <div className="chart-title">Score Distribution</div>
          <canvas ref={barRef} height="160" />
        </div>
      </div>
    </div>
  );
}