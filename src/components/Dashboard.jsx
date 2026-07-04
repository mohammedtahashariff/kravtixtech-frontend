import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard({ user, onUserUpdate, showToast }) {
  const [todayLogs, setTodayLogs] = useState([]);
  const [totalIntake, setTotalIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [history, setHistory] = useState([]);
  const [customAmount, setCustomAmount] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch today's intake and historical stats
  const fetchData = async () => {
    try {
      const todayData = await api.getTodayIntake();
      setTodayLogs(todayData.logs);
      setTotalIntake(todayData.totalIntake);
      setDailyGoal(todayData.dailyGoal);
      setCustomGoal(todayData.dailyGoal);

      const historyData = await api.getHistory();
      setHistory(historyData.history);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAdd = async (amount) => {
    try {
      await api.logIntake(amount);
      showToast(`Added ${amount}ml of water!`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCustomAdd = async (e) => {
    e.preventDefault();
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    try {
      await api.logIntake(amount);
      showToast(`Added ${amount}ml of water!`, 'success');
      setCustomAmount('');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await api.deleteIntake(logId);
      showToast('Water intake entry deleted', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    const goal = customGoal === '' ? null : parseInt(customGoal, 10);
    if (goal !== null && (isNaN(goal) || goal <= 0)) {
      showToast('Daily goal must be a positive integer', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.updateOwnGoal(goal);
      showToast('Your daily goal has been updated', 'success');
      setShowGoalModal(false);
      // Fetch latest data to trigger global goal fallback if user cleared custom goal
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Circular progress calculations
  const percentage = Math.round((totalIntake / dailyGoal) * 100) || 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  // Cap percentage at 100 for stroke dash offset, but display actual value in text
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  // History chart calculations
  const maxHistoryVal = Math.max(...history.map((h) => h.total), dailyGoal, 1000);
  // Sort history ascending to display chronologically from left to right (limit to last 7 days)
  const chartData = [...history]
    .reverse()
    .slice(-7);

  return (
    <div className="grid-2">
      {/* Left Column: Progress Ring & Logging */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Progress Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Today's Hydration
          </h3>
          <div className="progress-container">
            <svg className="progress-circle-svg">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
              <circle className="progress-circle-bg" cx="120" cy="120" r="90" />
              <circle
                className="progress-circle-bar"
                cx="120"
                cy="120"
                r="90"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percent">{percentage}%</span>
              <span className="progress-label">
                {totalIntake} / {dailyGoal} ml
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '12px 0 16px 0', textAlign: 'center' }}>
            {percentage >= 100 
              ? '🎉 Hydration goal achieved! Fantastic job!' 
              : `You need ${Math.max(0, dailyGoal - totalIntake)}ml more to hit your goal.`}
          </p>
          <button className="btn btn-secondary" onClick={() => setShowGoalModal(true)}>
            Edit Goal
          </button>
        </div>

        {/* Log Water Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Log Water Intake</h3>
          
          <div className="preset-container">
            <button className="preset-btn" onClick={() => handleQuickAdd(250)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>250 ml</span>
            </button>
            <button className="preset-btn" onClick={() => handleQuickAdd(500)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>500 ml</span>
            </button>
            <button className="preset-btn" onClick={() => handleQuickAdd(750)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>750 ml</span>
            </button>
          </div>

          <form onSubmit={handleCustomAdd} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <input
              type="number"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Custom amount (ml)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="1"
              required
            />
            <button className="btn btn-primary" type="submit">
              Log Water
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Daily Log List & History Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Today's Entries */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Today's Logs</h3>
          <div className="scrollable">
            {todayLogs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>
                No water logged yet today. Let's start drinking!
              </p>
            ) : (
              todayLogs.map((log) => (
                <div key={log.id} className="log-item">
                  <div>
                    <span className="log-amount">{log.amount} ml</span>
                    <div className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    className="btn-icon-delete"
                    onClick={() => handleDeleteLog(log.id)}
                    title="Delete log"
                    type="button"
                  >
                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>7-Day History</h3>
          {chartData.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              No history available yet. Keep logging to see trends!
            </p>
          ) : (
            <div>
              <div className="history-bar-container">
                {chartData.map((day, idx) => {
                  const barHeight = `${Math.min(100, (day.total / maxHistoryVal) * 100)}%`;
                  const formattedDate = new Date(day.date).toLocaleDateString([], {
                    weekday: 'short',
                    day: 'numeric'
                  });
                  return (
                    <div key={idx} className="history-bar-item">
                      <div
                        className="history-bar"
                        style={{ height: barHeight }}
                        data-total={`${day.total}ml`}
                      />
                      <div className="history-bar-date">{formattedDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Goal Config Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px' }}>Configure Goal</h3>
            <form onSubmit={handleUpdateGoal}>
              <div className="form-group">
                <label className="form-label" htmlFor="custom-goal">Daily Intake Goal (ml)</label>
                <input
                  id="custom-goal"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2000"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  min="1"
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Leave blank to use the recommended daily intake goal set by the Admin.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowGoalModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
