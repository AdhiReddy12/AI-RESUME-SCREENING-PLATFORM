import { useState, useEffect } from 'react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { api } from '../api';
import { toast } from '../utils/toast';

export function Jobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const blank = { title:'', department:'', description:'', requiredSkills:'', preferredSkills:'', minExperience:0, educationLevel:'BACHELORS', keywords:'', shortlistThreshold:70, rejectionThreshold:40, status:'OPEN' };
  const [form, setForm] = useState(blank);

  const load = () => {
    setLoading(true);
    api.get('/jobs').then(data => { setJobs(data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setForm(blank); setEditJob(null); setShowModal(true); };
  const openEdit   = (j) => {
    setForm({ title: j.title, department: j.department||'', description: j.description||'',
              requiredSkills: j.requiredSkills||'', preferredSkills: j.preferredSkills||'',
              minExperience: j.minExperience||0, educationLevel: j.educationLevel||'BACHELORS',
              keywords: j.keywords||'', shortlistThreshold: j.shortlistThreshold||70,
              rejectionThreshold: j.rejectionThreshold||40,
              status: j.status });
    setEditJob(j);
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editJob) { await api.put(`/jobs/${editJob.id}`, form); toast('Job updated'); }
      else         { await api.post('/jobs', form);              toast('Job created'); }
      setShowModal(false); load();
    } catch(e) { toast(e.message, 'error'); }
  };

  const del = async (j) => {
    if (!confirm(`Delete "${j.title}"?`)) return;
    try { await api.del(`/jobs/${j.id}`); toast('Job deleted'); load(); }
    catch(e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Job Listings</div>
          <div className="page-sub">{jobs.length} active positions</div>
        </div>
        <button className="btn btn-dark" onClick={openCreate}>+ New Job</button>
      </div>

      {loading ? <div className="loading-overlay"><TailChase size="40" speed="1.75" color="black" /></div> :
       jobs.length === 0 ? <div className="empty-state"><div className="empty-icon">💼</div><div className="empty-text">No jobs yet</div></div> : (
        <div className="jobs-grid">
          {jobs.map(j => (
            <div key={j.id} className="job-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div className="job-card-title">{j.title}</div>
                  <div className="job-card-dept">{j.department || '—'}</div>
                </div>
                <span className={`badge badge-${j.status}`}>{j.status}</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                {(j.requiredSkills||'').split(',').slice(0,4).map(s => s.trim()).filter(Boolean).map(s =>
                  <span key={s} className="tag">{s}</span>
                )}
              </div>
              <div className="job-card-meta">
                <span>🎓 {j.educationLevel}</span>
                <span>⏱ {j.minExperience}+ yrs</span>
                <span>🎯 {j.shortlistThreshold}% shortlist / ❌ {j.rejectionThreshold}% reject</span>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                <button className="btn btn-outline btn-sm" onClick={() => onSelectJob(j)}>View Candidates</button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(j)}>Edit</button>
                <button className="btn btn-sm" style={{background:'transparent',color:'var(--muted)',border:'none'}} onClick={() => del(j)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-title">{editJob ? 'Edit Job' : 'Create Job'}</div>
            <div className="form-grid">
              {[
                { label:'Job Title', key:'title', full:true },
                { label:'Department', key:'department' },
                { label:'Min Experience (years)', key:'minExperience', type:'number' },
              ].map(f => (
                <div key={f.key} className={`form-field ${f.full ? 'full' : ''}`}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type||'text'} value={form[f.key]}
                         onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
                </div>
              ))}
              <div className="form-field">
                <label className="form-label">Education Level</label>
                <select className="form-input" value={form.educationLevel}
                        onChange={e => setForm(p => ({...p, educationLevel: e.target.value}))}>
                  {['DIPLOMA','BACHELORS','MASTERS','PHD'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status}
                        onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                  {['OPEN','CLOSED','DRAFT'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-field full">
                <label className="form-label">Required Skills (comma-separated)</label>
                <input className="form-input" value={form.requiredSkills}
                       onChange={e => setForm(p => ({...p, requiredSkills: e.target.value}))} />
              </div>
              <div className="form-field full">
                <label className="form-label">Min Experience (Years)</label>
                <input className="form-input" type="number" min="0" value={form.minExperience}
                       onWheel={(e) => e.target.blur()}
                       onChange={e => setForm(p => ({...p, minExperience: +e.target.value}))} />
              </div>
              <div className="form-field full">
                <label className="form-label">Keywords (for keyword scoring)</label>
                <input className="form-input" value={form.keywords}
                       onChange={e => setForm(p => ({...p, keywords: e.target.value}))} />
              </div>
              <div className="form-field full">
                <label className="form-label">Preferred Skills</label>
                <input className="form-input" value={form.preferredSkills}
                       onChange={e => setForm(p => ({...p, preferredSkills: e.target.value}))} />
              </div>
              <div style={{display:'flex', gap:16}} className="full">
                <div className="form-field" style={{flex:1}}>
                  <label className="form-label">Shortlist Threshold (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.shortlistThreshold}
                         onWheel={(e) => e.target.blur()}
                         onChange={e => setForm(p => ({...p, shortlistThreshold: +e.target.value}))} />
                </div>
                <div className="form-field" style={{flex:1}}>
                  <label className="form-label">Rejection Threshold (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.rejectionThreshold}
                         onWheel={(e) => e.target.blur()}
                         onChange={e => setForm(p => ({...p, rejectionThreshold: +e.target.value}))} />
                </div>
              </div>
              <div className="form-field full">
                <label className="form-label">Job Description</label>
                <textarea className="form-input" value={form.description}
                          onChange={e => setForm(p => ({...p, description: e.target.value}))} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-dark" onClick={save}>Save Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}