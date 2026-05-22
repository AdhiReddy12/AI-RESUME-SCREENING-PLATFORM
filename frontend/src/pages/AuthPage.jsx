import { useState } from 'react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import { API_BASE } from '../api';
import { Toast } from '../components/Toast';

export function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (!isLogin && contactNumber && contactNumber.length !== 10) {
      setError('Contact number must be exactly 10 digits');
      return;
    }
    setLoading(true); setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const fullContact = contactNumber ? `${countryCode} ${contactNumber}` : '';
      const body = isLogin ? { email, password } : { email, password, fullName, companyName, contactNumber: fullContact };
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        if (res.status === 400) {
          const text = await res.text();
          setError(text || 'Registration failed');
        } else {
          setError(isLogin ? 'Invalid credentials' : 'An error occurred');
        }
        return;
      }
      const data = await res.json();
      onLogin(data);
    } catch (e) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap page-reveal">
      <div className="auth-left">
        <div className="auth-form-inner">
          <div className="auth-logo">Welcome To Resume<span>AI</span></div>
          <div className="auth-sub">{isLogin ? 'Sign in to your account' : 'Create your account'}</div>
          {error && <p className="error-msg">⚠ {error}</p>}
          
          <div className="auth-form-container">
            {!isLogin && (
              <>
                <div className="field-label">Full Name</div>
                <input className="field-input" placeholder="Enter your full name" value={fullName} onChange={e=>setFullName(e.target.value)}
                       onKeyDown={e=>e.key==='Enter'&&submit()} />
                       
                <div className="field-label">Company Name</div>
                <input className="field-input" placeholder="Enter your company name" value={companyName} onChange={e=>setCompanyName(e.target.value)}
                       onKeyDown={e=>e.key==='Enter'&&submit()} />
                       
                <div className="field-label">Contact Number</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="field-input" placeholder="+1" value={countryCode} onChange={e=>setCountryCode(e.target.value)} style={{ width: '60px' }} />
                  <input className="field-input" type="number" placeholder="10-digit number" value={contactNumber} onChange={e=> {
                     if (e.target.value.length <= 10) setContactNumber(e.target.value);
                  }} onKeyDown={e=>e.key==='Enter'&&submit()} style={{ flex: 1 }} />
                </div>
              </>
            )}

            <div className="field-label">E-mail</div>
            <input className="field-input" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)}
                   onKeyDown={e=>e.key==='Enter'&&submit()} />
            
            <div className="field-label">Password</div>
            <div style={{ position: 'relative' }}>
              <input className="field-input" placeholder="Enter your password" type={showPassword ? "text" : "password"} value={password}
                     onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
              <IconButton 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 0, top: '2px', color: 'var(--muted)' }}
              >
                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </div>

            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? <TailChase size="20" speed="1.75" color="white" /> : (isLogin ? 'Sign in' : 'Create an account')}
            </button>
            
            <div className="auth-switch">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="auth-switch-link" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-right-content">
          <h2>The Future of Talent Acquisition</h2>
          <p>Our AI-driven platform analyzes thousands of resumes in seconds, surfacing the perfect candidates without the manual screening.</p>
          <div className="glass-card">
            <div className="glass-stat">
              <div className="glass-stat-icon">⚡</div>
              <div className="glass-stat-info">
                <div>10x Faster Screening</div>
                <div>Reduce time-to-hire by automating initial resume reviews.</div>
              </div>
            </div>
            <div className="glass-stat">
              <div className="glass-stat-icon">🎯</div>
              <div className="glass-stat-info">
                <div>95% Match Accuracy</div>
                <div>Advanced NLP identifies the exact skills you're looking for.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toast />
    </div>
  );
}