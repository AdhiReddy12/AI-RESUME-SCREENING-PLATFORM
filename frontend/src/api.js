export const API_BASE = 'http://localhost:8080/api';

export const api = {
  token: null,
  setToken(t) { this.token = t; },
  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },
  async handleResponse(r) {
    if (!r.ok) {
      if (r.status === 429) {
        throw new Error("Too many requests. Please slow down and try again later.");
      }
      throw new Error(await r.text());
    }
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  },
  async get(path) {
    const r = await fetch(API_BASE + path, { headers: this.headers() });
    return this.handleResponse(r);
  },
  async post(path, body) {
    const r = await fetch(API_BASE + path, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    return this.handleResponse(r);
  },
  async put(path, body) {
    const r = await fetch(API_BASE + path, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    return this.handleResponse(r);
  },
  async patch(path, body) {
    const r = await fetch(API_BASE + path, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(body) });
    return this.handleResponse(r);
  },
  async del(path) {
    const r = await fetch(API_BASE + path, { method: 'DELETE', headers: this.headers() });
    if (!r.ok) {
      if (r.status === 429) {
        throw new Error("Too many requests. Please slow down and try again later.");
      }
      throw new Error(await r.text());
    }
    return r.ok;
  },
  async upload(path, formData) {
    const h = {};
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    const r = await fetch(API_BASE + path, { method: 'POST', headers: h, body: formData });
    return this.handleResponse(r);
  }
};