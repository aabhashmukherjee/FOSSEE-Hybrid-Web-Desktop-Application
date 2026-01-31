import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = 'https://fossee-hybrid-web-desktop-application-production.up.railway.app/api/';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [credentials, setCredentials] = useState({ username: '', password: '', email: '' });

  useEffect(() => {
    checkAuthStatus();
    fetchDatasets();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status/`);
      if (response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.log('Not authenticated');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username: credentials.username,
        password: credentials.password
      });
      setUser(response.data.user);
      setCredentials({ username: '', password: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register/`, credentials);
      setUser(response.data.user);
      setCredentials({ username: '', password: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout/`);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/datasets/`);
      setDatasets(response.data);
    } catch (err) {
      setError('Failed to fetch datasets');
    }
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/datasets/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedDataset(response.data);
      fetchDatasets();
      setUploadFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = async (datasetId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/datasets/${datasetId}/`);
      setSelectedDataset(response.data);
    } catch (err) {
      setError('Failed to load dataset details');
    }
  };

  const handleDownloadPDF = async (datasetId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/datasets/${datasetId}/generate_pdf/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${datasetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to generate PDF');
    }
  };

  // Chart data preparation
  const getChartData = () => {
    if (!selectedDataset || !selectedDataset.summary) return null;

    const summary = selectedDataset.summary;

    const barData = {
      labels: ['Avg Flowrate', 'Avg Pressure', 'Avg Temperature'],
      datasets: [{
        label: 'Average Values',
        data: [
          summary.avg_flowrate || 0,
          summary.avg_pressure || 0,
          summary.avg_temperature || 0
        ],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(255, 206, 86, 0.6)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 2
      }]
    };

    const pieData = {
      labels: Object.keys(summary.equipment_types || {}),
      datasets: [{
        label: 'Equipment Types',
        data: Object.values(summary.equipment_types || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderWidth: 2
      }]
    };

    return { barData, pieData };
  };

  const chartData = getChartData();

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧪 Chemical Equipment Visualizer</h1>
        <div className="auth-section">
          {user ? (
            <div>
              <span>Welcome, {user.username}!</span>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>
          ) : (
            <div className="auth-forms">
              <div className="auth-toggle">
                <button 
                  className={authMode === 'login' ? 'active' : ''} 
                  onClick={() => setAuthMode('login')}
                >
                  Login
                </button>
                <button 
                  className={authMode === 'register' ? 'active' : ''} 
                  onClick={() => setAuthMode('register')}
                >
                  Register
                </button>
              </div>
              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                <input
                  type="text"
                  placeholder="Username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  required
                />
                {authMode === 'register' && (
                  <input
                    type="email"
                    placeholder="Email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  />
                )}
                <input
                  type="password"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  {authMode === 'login' ? 'Login' : 'Register'}
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="App-main">
        {error && <div className="error-message">{error}</div>}

        <section className="upload-section">
          <h2>📤 Upload CSV Data</h2>
          <form onSubmit={handleUpload}>
            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !uploadFile} className="btn btn-primary">
              {loading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </form>
        </section>

        <section className="datasets-section">
          <h2>📊 Recent Datasets (Last 5)</h2>
          <div className="datasets-list">
            {datasets.length === 0 ? (
              <p>No datasets uploaded yet</p>
            ) : (
              datasets.map(dataset => (
                <div key={dataset.id} className="dataset-card" onClick={() => handleDatasetSelect(dataset.id)}>
                  <h3>{dataset.filename}</h3>
                  <p>Uploaded: {new Date(dataset.uploaded_at).toLocaleString()}</p>
                  <p>Total Rows: {dataset.total_rows}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(dataset.id); }}
                    className="btn btn-secondary"
                  >
                    Download PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {selectedDataset && (
          <section className="analysis-section">
            <h2>📈 Analysis: {selectedDataset.filename}</h2>
            
            <div className="summary-stats">
              <div className="stat-card">
                <h3>Total Equipment</h3>
                <p>{selectedDataset.summary?.total_count || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Avg Flowrate</h3>
                <p>{selectedDataset.summary?.avg_flowrate?.toFixed(2) || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Avg Pressure</h3>
                <p>{selectedDataset.summary?.avg_pressure?.toFixed(2) || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Avg Temperature</h3>
                <p>{selectedDataset.summary?.avg_temperature?.toFixed(2) || 0}</p>
              </div>
            </div>

            {chartData && (
              <div className="charts-container">
                <div className="chart">
                  <h3>Average Parameter Values</h3>
                  <Bar data={chartData.barData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
                <div className="chart">
                  <h3>Equipment Type Distribution</h3>
                  <Pie data={chartData.pieData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
              </div>
            )}

            <div className="data-table">
              <h3>Equipment Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Equipment Name</th>
                    <th>Type</th>
                    <th>Flowrate</th>
                    <th>Pressure</th>
                    <th>Temperature</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDataset.equipment?.map(eq => (
                    <tr key={eq.id}>
                      <td>{eq.equipment_name}</td>
                      <td>{eq.equipment_type}</td>
                      <td>{eq.flowrate}</td>
                      <td>{eq.pressure}</td>
                      <td>{eq.temperature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="App-footer">
        <p>Chemical Equipment Parameter Visualizer - FOSSEE Internship 2026</p>
      </footer>
    </div>
  );
}

export default App;
