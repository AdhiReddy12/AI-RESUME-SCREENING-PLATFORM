import { useState, useEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { api } from '../api';
import { toast } from '../utils/toast';
import { ScoreBar } from '../components/ScoreBar';

export function Candidates({ initialJob }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(initialJob ? String(initialJob.id) : '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    api.get('/jobs').then(d => {
      setJobs(d);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (initialJob) setSelectedJob(String(initialJob.id));
  }, [initialJob]);

  useEffect(() => {
    setLoading(true);
    const endpoint = selectedJob ? `/resumes/job/${selectedJob}/results` : '/resumes/results';
    api.get(endpoint)
       .then(d => { setResults(d); setLoading(false); })
       .catch(() => setLoading(false));
  }, [selectedJob]);

  const updateStatus = async (id, status) => {
    try {
      const updated = await api.patch(`/resumes/result/${id}/status`, { status });
      setResults(p => p.map(r => r.id===id ? updated : r));
      if (selected?.id === id) setSelected(updated);
      toast('Status updated');
    } catch(e) { toast(e.message, 'error'); }
  };

  const deleteCandidate = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await api.del(`/resumes/result/${id}`);
      setResults(p => p.filter(r => r.id !== id));
      if (selected?.id === id) setSelected(null);
      toast('Candidate deleted');
    } catch(e) {
      toast(e.message, 'error');
    }
  };

  const clearAllCandidates = async () => {
    const msg = selectedJob 
      ? 'Are you sure you want to clear ALL candidates for this specific job?' 
      : 'Are you sure you want to clear ALL candidates across ALL jobs? This cannot be undone.';
    if (!confirm(msg)) return;
    
    setLoading(true);
    try {
      const endpoint = selectedJob ? `/resumes/results?jobId=${selectedJob}` : `/resumes/results`;
      await api.del(endpoint);
      setResults([]);
      toast('All candidates cleared');
    } catch(e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setFilterStatus('ALL');
    setSelectedJob('');
  };

  const filtered = filterStatus === 'ALL' ? results : results.filter(r => r.status === filterStatus);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Candidates</div>
          <div className="page-sub">{results.length} screened · {results.filter(r=>r.status==='SHORTLISTED').length} shortlisted</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" onClick={resetFilters}>Reset Filters</button>
            <button className="btn btn-outline" style={{borderColor: 'rgba(255,100,100,0.3)', color: '#ff6b6b'}} onClick={clearAllCandidates}>
              Clear All Candidates
            </button>
          </div>
          <select className="select-sm" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <select className="select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {['SCREENED','SHORTLISTED','INTERVIEWED','OFFERED','HIRED','REJECTED'].map(s =>
              <option key={s}>{s}</option>
            )}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-overlay"><TailChase size="40" speed="1.75" color="black" /></div> :
         filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">👤</div><div className="empty-text">No candidates found</div></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Candidate</th><th>Overall</th><th>Skills</th><th>Exp.</th><th>Edu.</th><th>Years</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => setSelected(r)}>
                    <td>
                      <strong>{r.candidateName || 'Unknown'}</strong><br />
                      <small style={{color:'var(--muted)',fontSize:11}}>{r.candidateEmail}</small>
                    </td>
                    <td><ScoreBar value={r.overallScore} /></td>
                    <td><ScoreBar value={r.skillsScore} /></td>
                    <td><ScoreBar value={r.experienceScore} /></td>
                    <td><ScoreBar value={r.educationScore} /></td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{r.yearsExperience||0}y</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select className="select-sm" value={r.status}
                              onChange={e => updateStatus(r.id, e.target.value)}>
                        {['SCREENED','SHORTLISTED','INTERVIEWED','OFFERED','HIRED','REJECTED'].map(s =>
                          <option key={s}>{s}</option>
                        )}
                      </select>
                      <button className="btn-delete" onClick={(e) => deleteCandidate(r.id, e)} title="Delete candidate" style={{ display: 'flex', alignItems: 'center' }}>
                        <DeleteIcon fontSize="small" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <div className={`detail-panel ${selected ? 'open' : ''}`}>
        {selected && <>
          <span className="detail-close" onClick={() => setSelected(null)}>✕</span>
          <div style={{ marginTop: 8, fontSize: 11, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Candidate Profile</div>
          <div className="detail-name">{selected.candidateName || 'Unknown'}</div>
          <div className="detail-email">{selected.candidateEmail || '—'} · {selected.candidatePhone || ''}</div>
          <span className={`badge badge-${selected.status}`} style={{marginBottom:20,display:'inline-block'}}>{selected.status}</span>

          <div className="score-ring-row">
            {[
              { label:'Overall', val: selected.overallScore },
              { label:'Skills',  val: selected.skillsScore },
              { label:'Exp.',    val: selected.experienceScore },
              { label:'Edu.',    val: selected.educationScore },
            ].map(s => (
              <div key={s.label} className="score-ring">
                <div className="score-ring-val" style={{ color: s.val>=70?'var(--success)':s.val>=50?'var(--warn)':'var(--accent)' }}>
                  {Math.round(s.val||0)}
                </div>
                <div className="score-ring-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Details</div>
            <div style={{fontSize:13,lineHeight:2}}>
              <span style={{color:'var(--muted)'}}>Experience: </span>{selected.yearsExperience||0} years<br/>
              <span style={{color:'var(--muted)'}}>Education: </span>{selected.educationLevel||'—'}<br/>
              {selected.candidateLinkedin && <><span style={{color:'var(--muted)'}}>LinkedIn: </span>{selected.candidateLinkedin}<br/></>}
            </div>
          </div>

          {selected.matchedSkills && (() => {
            let skills = [];
            try { skills = JSON.parse(selected.matchedSkills); } catch { /* ignore parse error */ }
            return skills.length ? (
              <div className="detail-section">
                <div className="detail-section-title">Matched Skills</div>
                {skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
            ) : null;
          })()}

          {selected.aiSummary && (
            <div className="detail-section">
              <div className="detail-section-title">AI Summary</div>
              <p className="summary-text">{selected.aiSummary}</p>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Update Status</div>
            <select className="form-input" value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}>
              {['SCREENED','SHORTLISTED','INTERVIEWED','OFFERED','HIRED','REJECTED'].map(s =>
                <option key={s}>{s}</option>
              )}
            </select>
          </div>
        </>}
      </div>
    </div>
  );
}