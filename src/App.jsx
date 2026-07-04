import React, { useState, useEffect } from 'react';
import api from './utils/api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Toast from './components/Shared/Toast';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard'); // 'dashboard' or 'admin'
  const [toasts, setToasts] = useState([]);

  // Check login status on startup
  useEffect(() => {
    const loggedInUser = api.getUser();
    const token = api.getToken();
    if (loggedInUser && token) {
      setUser(loggedInUser);
      // Direct admins to the admin panel by default, normal users to dashboard
      setPage(loggedInUser.role === 'admin' ? 'admin' : 'dashboard');
    }
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setPage('dashboard');
    showToast('Successfully logged out', 'success');
  };

  return (
    <div className="app-container">
      
      {/* Toast Alert Renderer */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <header className="glass-card navbar">
        <div className="brand">
          <svg style={{ width: '28px', height: '28px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
          </svg>
          <span>HydraTracker</span>
        </div>

        {user && (
          <div className="nav-actions">
            <span className="user-badge">
              {user.email} ({user.role})
            </span>
            
            {user.role === 'admin' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${page === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  onClick={() => setPage('dashboard')}
                  type="button"
                >
                  My Logs
                </button>
                <button
                  className={`btn ${page === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  onClick={() => setPage('admin')}
                  type="button"
                >
                  Admin Panel
                </button>
              </div>
            )}

            <button
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              onClick={handleLogout}
              type="button"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {!user ? (
          <Auth
            onAuthSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              setPage(loggedInUser.role === 'admin' ? 'admin' : 'dashboard');
            }}
            showToast={showToast}
          />
        ) : page === 'admin' && user.role === 'admin' ? (
          <AdminDashboard showToast={showToast} />
        ) : (
          <Dashboard
            user={user}
            onUserUpdate={(updatedUser) => setUser(updatedUser)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '48px', textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>&copy; {new Date().getFullYear()} HydraTracker. Build healthy habits, one glass at a time.</p>
      </footer>

    </div>
  );
}
