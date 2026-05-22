export const API_BASE = 'http://localhost:8080/api';

export const api = {
  token: null,
  setToken(t) { this.token = t; },
  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },
  async get(path) {
    const r = await fetch(API_BASE + path, { headers: this.headers() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(API_BASE + path, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async put(path, body) {
    const r = await fetch(API_BASE + path, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async patch(path, body) {
    const r = await fetch(API_BASE + path, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(path) {
    const r = await fetch(API_BASE + path, { method: 'DELETE', headers: this.headers() });
    if (!r.ok) throw new Error(await r.text());
    return r.ok;
  },
  async upload(path, formData) {
    const h = {};
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    const r = await fetch(API_BASE + path, { method: 'POST', headers: h, body: formData });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
};