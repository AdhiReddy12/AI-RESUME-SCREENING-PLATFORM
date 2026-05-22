import { useState, useRef } from 'react';
import { api } from '../api';
import { toast } from '../utils/toast';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';

export function Profile({ auth, setAuth }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(auth.fullName || '');
  const [companyName, setCompanyName] = useState(auth.companyName || '');
  const [countryCode, setCountryCode] = useState(auth.contactNumber ? auth.contactNumber.split(' ')[0] : '+1');
  const [contactNumber, setContactNumber] = useState(auth.contactNumber ? auth.contactNumber.split(' ').slice(1).join(' ') : '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const initials = (name) => name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '';

  const handleSave = async () => {
    if (contactNumber && contactNumber.length !== 10) {
      toast('Contact number must be exactly 10 digits', 'error');
      return;
    }
    setLoading(true);
    try {
      const fullContact = contactNumber ? `${countryCode} ${contactNumber}` : '';
      const res = await api.put('/users/profile', { fullName, companyName, contactNumber: fullContact });
      const updatedAuth = { ...auth, fullName: res.fullName, companyName: res.companyName, contactNumber: res.contactNumber };
      setAuth(updatedAuth);
      localStorage.setItem('jwt_user', JSON.stringify(updatedAuth));
      toast('Profile updated successfully!');
      setEditing(false);
    } catch (e) {
      toast('Failed to update profile: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      // Need to use fetch directly or api.upload
      const res = await api.upload('/users/profile/picture', fd);
      const fileUrl = res.url || res; // depending on what api returns
      
      const updatedAuth = { ...auth, profilePicture: fileUrl };
      setAuth(updatedAuth);
      localStorage.setItem('jwt_user', JSON.stringify(updatedAuth));
      toast('Profile picture updated!');
    } catch (err) {
      toast('Failed to upload picture: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Removed unused API_BASE variable
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-sub">Manage your personal information</div>
        </div>
        {!editing && (
          <button className="btn btn-dark" onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
          <div 
            className="user-avatar" 
            style={{ width: 100, height: 100, fontSize: 36, marginBottom: 15, cursor: 'pointer', position: 'relative' }}
            onClick={() => fileInputRef.current.click()}
          >
            {auth.profilePicture ? (
              <img src={`http://localhost:8080${auth.profilePicture}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              initials(auth.fullName || auth.email)
            )}
            {uploading && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TailChase size="40" speed="1.75" color="white" /></div>}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Click to upload picture</div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePictureUpload} />
          <div style={{ marginTop: 15, fontSize: 14 }}>
             <span className="badge badge-SCREENED">{auth.role}</span>
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 20 }}>
          <label className="form-label">Full Name</label>
          {editing ? (
            <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
          ) : (
            <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>{auth.fullName || '—'}</div>
          )}
        </div>
        
        <div className="form-field" style={{ marginBottom: 20 }}>
          <label className="form-label">Email</label>
          <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, opacity: 0.7 }}>{auth.email} (Cannot be changed)</div>
        </div>

        <div className="form-field" style={{ marginBottom: 20 }}>
          <label className="form-label">Company Name</label>
          {editing ? (
            <input className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          ) : (
            <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>{auth.companyName || '—'}</div>
          )}
        </div>

        <div className="form-field" style={{ marginBottom: 30 }}>
          <label className="form-label">Contact Number</label>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" placeholder="+1" value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ width: '60px' }} />
              <input className="form-input" type="number" placeholder="10-digit number" value={contactNumber} onChange={e => {
                if (e.target.value.length <= 10) setContactNumber(e.target.value);
              }} style={{ flex: 1 }} />
            </div>
          ) : (
            <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>{auth.contactNumber || '—'}</div>
          )}
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => {
              setEditing(false);
              setFullName(auth.fullName || '');
              setCompanyName(auth.companyName || '');
              setCountryCode(auth.contactNumber ? auth.contactNumber.split(' ')[0] : '+1');
              setContactNumber(auth.contactNumber ? auth.contactNumber.split(' ').slice(1).join(' ') : '');
            }} disabled={loading}>Cancel</button>
            <button className="btn btn-dark" onClick={handleSave} disabled={loading}>
              {loading ? <TailChase size="20" speed="1.75" color="white" /> : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
