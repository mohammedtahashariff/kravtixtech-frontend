import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminDashboard({ showToast }) {
  const [users, setUsers] = useState([]);
  const [globalGoal, setGlobalGoal] = useState(2000);
  const [newGlobalGoal, setNewGlobalGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Fetch admin dashboard details
  const fetchDashboardData = async () => {
    try {
      const usersList = await api.getUsers();
      setUsers(usersList);

      const goalData = await api.getGlobalGoal();
      setGlobalGoal(goalData.recommended_daily_goal);
      setNewGlobalGoal(goalData.recommended_daily_goal);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateGlobalGoal = async (e) => {
    e.preventDefault();
    const amount = parseInt(newGlobalGoal, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('Global goal must be a positive integer', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.updateGlobalGoal(amount);
      showToast('Global recommended daily goal updated!', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    const currentUser = api.getUser();
    if (currentUser && currentUser.id === userId) {
      showToast('You cannot delete your own admin account!', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete the user account: ${userEmail}?`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      showToast('User account successfully deleted', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewUserHistory = async (userId) => {
    try {
      const historyData = await api.getUserHistory(userId);
      setUserHistory(historyData);
      setSelectedUser(historyData.user);
      setShowHistoryModal(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Top Section: Admin Quick Metrics & Global Settings */}
      <div className="grid-2">
        {/* Quick Metrics Card */}
        <div className="glass-card grid-3" style={{ padding: '24px', gap: '20px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{users.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Global Goal</span>
            <span className="stat-value">{globalGoal} ml</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Admins</span>
            <span className="stat-value">{users.filter(u => u.role === 'admin').length}</span>
          </div>
        </div>

        {/* Global Settings Panel */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
            Recommended Water Goal
          </h3>
          <form onSubmit={handleUpdateGlobalGoal} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="number"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Recommended goal (ml)"
              value={newGlobalGoal}
              onChange={(e) => setNewGlobalGoal(e.target.value)}
              min="1"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              Update Goal
            </button>
          </form>
        </div>
      </div>

      {/* Main Section: User Directory Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>User Directory</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Manage user accounts and view individual water consumption metrics.
        </p>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Daily Goal</th>
                <th>Registered Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = api.getUser()?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.email} {isSelf && <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>(You)</span>}</td>
                    <td>
                      <span className="user-badge" style={{ 
                        background: u.role === 'admin' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.dailyGoal ? `${u.dailyGoal} ml` : `${globalGoal} ml (default)`}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleViewUserHistory(u.id)}
                          type="button"
                        >
                          View Logs
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          disabled={isSelf}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History inspection Modal */}
      {showHistoryModal && selectedUser && userHistory && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="glass-card modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Consumption History</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedUser.email}</p>
              </div>
              <button className="btn-icon-delete" onClick={() => setShowHistoryModal(false)}>
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Stats overview */}
              <div className="grid-3" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Daily Goal</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{selectedUser.dailyGoal} ml</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Logs</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{userHistory.logs.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Intake</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{userHistory.logs.reduce((s, l) => s + l.amount, 0)} ml</div>
                </div>
              </div>

              {/* History Graph */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Recent Consumption</h4>
                {userHistory.history.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                    No water logged by this user.
                  </p>
                ) : (
                  <div className="history-bar-container" style={{ height: '140px' }}>
                    {userHistory.history.reverse().slice(-7).map((day, idx) => {
                      const maxVal = Math.max(...userHistory.history.map(h => h.total), selectedUser.dailyGoal, 1000);
                      const barHeight = `${Math.min(100, (day.total / maxVal) * 100)}%`;
                      const formattedDate = new Date(day.date).toLocaleDateString([], { weekday: 'short', day: 'numeric' });
                      return (
                        <div key={idx} className="history-bar-item">
                          <div className="history-bar" style={{ height: barHeight }} data-total={`${day.total}ml`} />
                          <div className="history-bar-date">{formattedDate}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Logs List */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Detailed Log List</h4>
                <div className="scrollable" style={{ maxHeight: '200px' }}>
                  {userHistory.logs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                      No log entries.
                    </p>
                  ) : (
                    userHistory.logs.map((log) => (
                      <div key={log.id} className="log-item" style={{ padding: '10px 14px' }}>
                        <div>
                          <span className="log-amount" style={{ fontSize: '0.95rem' }}>{log.amount} ml</span>
                          <span className="log-time" style={{ marginLeft: '12px' }}>
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
