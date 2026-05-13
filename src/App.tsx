import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Companies } from './pages/Companies/Companies';
import { Coaches } from './pages/Coaches/Coaches';
import { Users } from './pages/Users/Users';
import { Analytics } from './pages/Analytics/Analytics';
import { Settings } from './pages/Settings/Settings';
import { Onboarding } from './pages/Onboarding/Onboarding';
import { Sessions } from './pages/Sessions/Sessions';

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/coaches" element={<Coaches />} />
              <Route path="/users" element={<Users />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
