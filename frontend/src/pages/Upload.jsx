import { useState, useEffect, useRef } from 'react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { api } from '../api';
import { toast } from '../utils/toast';
import { ScoreBar } from '../components/ScoreBar';

export function Upload() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef();

  useEffect(() => {
    api.get('/jobs').then(data => { setJobs(data); if(data[0]) setSelectedJob(String(data[0].id)); }).catch(()=>{});
  }, []);

  const addFiles = f => {
    const newFiles = Array.from(f);
    setFiles(p => {
      const existing = new Set(p.map(x => x.name));
      return [...p, ...newFiles.filter(x => !existing.has(x.name) && (x.name.toLowerCase().endsWith('.pdf')||x.name.toLowerCase().endsWith('.docx')))];
    });
  };

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const upload = async () => {
    if (!files.length || !selectedJob) return;
    setUploading(true); setResults([]);
    try {
      if (files.length === 1) {
        const fd = new FormData();
        fd.append('file', files[0]);
        fd.append('jobId', selectedJob);
        const r = await api.upload('/resumes/upload', fd);
        setResults([r]);
      } else {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        fd.append('jobId', selectedJob);
        const r = await api.upload('/resumes/upload/bulk', fd);
        setResults(Array.isArray(r) ? r : [r]);
      }
      toast(`Screened ${files.length} resume(s) successfully`);
      setFiles([]);
    } catch(e) {
      toast('Upload failed: ' + e.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const fmt = b => b < 1024 ? b+'B' : b < 1048576 ? Math.round(b/1024)+'KB' : (b/1048576).toFixed(1)+'MB';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Upload Resumes</div>
          <div className="page-sub">PDF and DOCX supported · up to 50 at once</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-field" style={{ marginBottom: 20 }}>
          <label className="form-label">Select Job Position</label>
          <select className="form-input" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                  style={{ maxWidth: 360 }}>
            <option value="">— Choose a job —</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div className={`upload-zone ${dragging ? 'dragging' : ''}`}
             onDragOver={e => { e.preventDefault(); setDragging(true); }}
             onDragLeave={() => setDragging(false)}
             onDrop={onDrop}
             onClick={() => inputRef.current.click()}>
          <div className="upload-icon">📄</div>
          <div className="upload-label">Drop resumes here</div>
          <div className="upload-sub">or click to browse · PDF, DOCX · max 20MB each</div>
          <input ref={inputRef} type="file" multiple accept=".pdf,.docx" className="upload-input"
                 onChange={e => {
                   addFiles(e.target.files);
                   e.target.value = null;
                 }} />
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f,i) => (
              <div key={i} className="file-item">
                <span>{f.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size">{fmt(f.size)}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setFiles(p => p.filter((_,j)=>j!==i))}>✕</button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div style={{ marginTop: 20, display:'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-dark" onClick={upload} disabled={uploading || !selectedJob}>
              {uploading ? <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><TailChase size="20" speed="1.75" color="white" /> Screening…</div> : `Screen ${files.length} Resume${files.length>1?'s':''}`}
            </button>
            <button className="btn btn-outline" onClick={() => setFiles([])}>Clear All</button>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Screening Results</div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Candidate</th><th>Overall</th><th>Skills</th><th>Experience</th><th>Education</th><th>Status</th>
              </tr></thead>
              <tbody>
                {results.map((r,i) => (
                  <tr key={i}>
                    <td><strong>{r.candidateName||'Unknown'}</strong><br /><small style={{color:'var(--muted)'}}>{r.candidateEmail}</small></td>
                    <td><ScoreBar value={r.overallScore} /></td>
                    <td><ScoreBar value={r.skillsScore} /></td>
                    <td><ScoreBar value={r.experienceScore} /></td>
                    <td><ScoreBar value={r.educationScore} /></td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}