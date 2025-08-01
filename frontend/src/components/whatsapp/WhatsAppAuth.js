import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import './WhatsAppAuth.css';

const WhatsAppAuth = () => {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000); // Check status every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await apiService.get('/api/whatsapp/status');
      const { state, isReady: ready, hasQR } = response.data;
      
      setStatus(state);
      setIsReady(ready);
      
      if (hasQR && !ready) {
        await getQRCode();
      } else if (ready) {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setError('Failed to check WhatsApp status');
    }
  };

  const getQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get('/api/whatsapp/qr');
      
      if (response.data && response.data.qr) {
        setQrCode(response.data.qr);
      } else {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
      setError('Failed to get QR code');
    } finally {
      setLoading(false);
    }
  };

  const restartClient = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.post('/api/whatsapp/restart');
      
      // Wait a moment then check status
      setTimeout(() => {
        checkStatus();
      }, 2000);
    } catch (error) {
      console.error('Error restarting WhatsApp client:', error);
      setError('Failed to restart WhatsApp client');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'CONNECTED':
        return 'green';
      case 'PAIRING':
        return 'orange';
      case 'TIMEOUT':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    if (isReady) return 'Connected & Ready';
    
    switch (status) {
      case 'CONNECTED':
        return 'Connected';
      case 'PAIRING':
        return 'Pairing...';
      case 'TIMEOUT':
        return 'Connection Timeout';
      case 'OPENING':
        return 'Opening...';
      case 'CONFLICT':
        return 'Session Conflict';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="whatsapp-auth">
      <div className="auth-header">
        <h2>WhatsApp Authentication</h2>
        <div className="status-indicator">
          <span 
            className="status-dot" 
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="auth-content">
        {isReady ? (
          <div className="connected-state">
            <div className="success-icon">✅</div>
            <h3>WhatsApp Connected Successfully!</h3>
            <p>You can now send messages through WhatsApp.</p>
            <button 
              onClick={restartClient}
              className="restart-btn"
              disabled={loading}
            >
              {loading ? 'Restarting...' : 'Restart Connection'}
            </button>
          </div>
        ) : (
          <div className="qr-section">
            <h3>Scan QR Code with WhatsApp</h3>
            <p>Open WhatsApp on your phone and scan this QR code to connect.</p>
            
            <div className="qr-container">
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading QR Code...</p>
                </div>
              ) : qrCode ? (
                <div className="qr-code">
                  <img src={qrCode} alt="WhatsApp QR Code" />
                  <p className="qr-instructions">
                    1. Open WhatsApp on your phone<br/>
                    2. Tap Menu (⋮) → Linked devices<br/>
                    3. Tap "Link a device"<br/>
                    4. Scan this QR code
                  </p>
                </div>
              ) : (
                <div className="no-qr">
                  <p>No QR code available. Click refresh to try again.</p>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button 
                onClick={getQRCode}
                disabled={loading}
                className="refresh-btn"
              >
                {loading ? 'Loading...' : 'Refresh QR Code'}
              </button>
              <button 
                onClick={restartClient}
                disabled={loading}
                className="restart-btn"
              >
                {loading ? 'Restarting...' : 'Restart Client'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppAuth; 