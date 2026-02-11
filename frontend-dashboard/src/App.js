import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  // Helper to determine threat level style
  const getThreatStyle = (text) => {
    if (text.includes("HIGH")) return "card-high";
    if (text.includes("MEDIUM")) return "card-medium";
    return "card-low";
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🛡️ Vigil-Edge Surveillance</h1>
        <p>Real-Time Multi-Threat Detection Dashboard</p>
      </header>

      <div className="alert-grid">
        {alerts.length === 0 ? (
          <p className="no-data">System Secure. No Active Threats.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert._id} className={`alert-card ${getThreatStyle(alert.objectDetected)}`}>
              <div className="alert-header">
                {/* Shows: [HIGH] or [LOW] */}
                <span className="badge">{alert.objectDetected.split(']')[0] + ']'}</span> 
                <span className="time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <img 
                src={`data:image/jpeg;base64,${alert.image}`} 
                alt="Evidence" 
                className="evidence-img"
              />
              
              <div className="alert-footer">
                {/* Shows: KNIFE or PHONE */}
                <h3>{alert.objectDetected.split(']')[1] || alert.objectDetected}</h3>
                <p>Confidence: 90% • Cam-01</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;