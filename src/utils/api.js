const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),
  
  getUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('user'),

  async request(endpoint, options = {}) {
    const token = api.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  },

  // Auth Endpoints
  async login(email, password) {
    const res = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    api.setToken(res.token);
    api.setUser(res.user);
    return res;
  },

  async register(email, password) {
    const res = await api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    api.setToken(res.token);
    api.setUser(res.user);
    return res;
  },

  logout() {
    api.clearToken();
    api.clearUser();
  },

  // User Endpoints
  async getUsers() {
    return api.request('/users');
  },

  async deleteUser(userId) {
    return api.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  },

  async updateOwnGoal(dailyGoal) {
    const res = await api.request('/users/me/goal', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoal })
    });
    // Update stored user goal
    const user = api.getUser();
    if (user) {
      user.dailyGoal = res.dailyGoal;
      api.setUser(user);
    }
    return res;
  },

  async getGlobalGoal() {
    return api.request('/users/settings/daily-goal');
  },

  async updateGlobalGoal(recommended_daily_goal) {
    return api.request('/users/settings/daily-goal', {
      method: 'PUT',
      body: JSON.stringify({ recommended_daily_goal })
    });
  },

  // Intake Endpoints
  async logIntake(amount, timestamp = null) {
    return api.request('/intake', {
      method: 'POST',
      body: JSON.stringify({ amount, timestamp })
    });
  },

  async getTodayIntake() {
    return api.request('/intake/today');
  },

  async getHistory() {
    return api.request('/intake/history');
  },

  async deleteIntake(logId) {
    return api.request(`/intake/${logId}`, {
      method: 'DELETE'
    });
  },

  async getUserHistory(userId) {
    return api.request(`/intake/users/${userId}`);
  }
};

export default api;
