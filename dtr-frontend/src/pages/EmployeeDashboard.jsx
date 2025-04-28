import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState({
    morningIn: false,
    morningOut: false,
    afternoonIn: false,
    afternoonOut: false
  });
  const [lastAction, setLastAction] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysRecords, setTodaysRecords] = useState({});
  const [employeeData, setEmployeeData] = useState({ name: '', position: '' });
  const [error, setError] = useState(null);

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        
        // Fetch employee data
        const empResponse = await axios.get(`http://localhost:5000/api/employees/${userId}`, config);
        setEmployeeData(empResponse.data);
        
        // Fetch today's records
        const today = new Date().toISOString().split('T')[0];
        const recordsResponse = await axios.get(`http://localhost:5000/api/dtr/${userId}?date=${today}`, config);
        setTodaysRecords(recordsResponse.data || {});
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't show error if it's just employee data failing
        if (!employeeData.name) {
          setEmployeeData({ name: 'Employee', position: 'Staff' });
        }
      }
    };

    fetchData();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [token, userId]);

  const handleLogout = () => {
      localStorage.removeItem('token'); // Remove saved token
      window.location.href = '/login';  // Redirect to login page
    };

  const handleTime = async (type) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      setError(null);
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
  
      const response = await axios.post(
        'http://localhost:5000/api/dtr/time', 
        { userId, type }, 
        config
      );
      
      // Update the specific record immediately
      setTodaysRecords(prev => ({
        ...prev,
        [type]: new Date().toISOString()
      }));

      // Show success feedback
      setLastAction({
        type,
        timestamp: new Date().toLocaleTimeString(),
        success: true
      });

      setTimeout(() => setLastAction(null), 3000);
    } catch (error) {
      console.error('Error recording time:', error);
      setLastAction({
        type,
        timestamp: new Date().toLocaleTimeString(),
        success: false
      });
      setError(error.response?.data?.message || 'Failed to record time');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const getButtonConfig = (type) => {
    const baseConfigs = {
      morningIn: {
        label: 'Morning Time In',
        icon: '🌅',
        activeIcon: '✅', // Success icon
        color: 'from-blue-500 to-blue-600',
        shortLabel: 'AM In'
      },
      morningOut: {
        label: 'Morning Time Out',
        icon: '☀️',
        activeIcon: '✅',
        color: 'from-amber-500 to-amber-600',
        shortLabel: 'AM Out'
      },
      afternoonIn: {
        label: 'Afternoon Time In',
        icon: '🌤️',
        activeIcon: '✅',
        color: 'from-green-500 to-green-600',
        shortLabel: 'PM In'
      },
      afternoonOut: {
        label: 'Afternoon Time Out',
        icon: '🌇',
        activeIcon: '✅',
        color: 'from-purple-500 to-purple-600',
        shortLabel: 'PM Out'
      }
    };

    // If this action was just completed successfully
    if (lastAction?.type === type && lastAction.success) {
      return {
        ...baseConfigs[type],
        icon: baseConfigs[type].activeIcon,
        color: 'from-green-500 to-green-600'
      };
    }

    return baseConfigs[type] || { 
      label: type, 
      icon: '', 
      color: 'from-gray-500 to-gray-600', 
      shortLabel: type 
    };
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center relative">
          <h1 className="text-2xl font-bold text-white">Employee Dashboard</h1>
          <p className="text-indigo-100 mt-1">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1 text-white text-sm">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center text-indigo-600 text-2xl font-bold">
              {employeeData.name ? employeeData.name.charAt(0) : 'E'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{employeeData.name || 'Employee'}</h2>
              <p className="text-gray-600">{employeeData.position || 'Position'}</p>
              <p className="text-sm text-gray-500">ID: {userId}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Left Column - Time Recording */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Time Recording</h3>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center justify-center">
                <span className="font-medium">⚠️ {error}</span>
              </div>
            )}
            
            {/* Success message */}
            {lastAction?.success && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center justify-center">
                <span className="font-medium">
                  ✅ {getButtonConfig(lastAction.type).label} recorded at {lastAction.timestamp}
                </span>
              </div>
            )}

            {/* Time buttons grid */}
            <div className="grid grid-cols-2 gap-3">
              {['morningIn', 'morningOut', 'afternoonIn', 'afternoonOut'].map((type) => {
                const config = getButtonConfig(type);
                const isActive = lastAction?.type === type && lastAction.success;
                const isLoading = loading[type];
                
                return (
                  <button
                    key={type}
                    onClick={() => handleTime(type)}
                    disabled={isLoading}
                    className={`bg-gradient-to-r ${config.color} text-white p-4 rounded-lg shadow hover:shadow-md transition-all flex flex-col items-center justify-center ${
                      isLoading ? 'opacity-70' : ''
                    } ${
                      isActive ? 'ring-2 ring-offset-2 ring-green-500' : ''
                    }`}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm mt-1">{config.shortLabel}</span>
                    {isLoading && (
                      <span className="mt-1">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/dtr')}
                  className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>📅</span>
                  <span>View DTR</span>
                </button>
                <button 
                  onClick={() => navigate('/leave-request')}
                  className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>✉️</span>
                  <span>Leave Request</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Today's Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Today's Summary</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`bg-white p-3 rounded-lg shadow-sm ${
                  todaysRecords.morningIn ? 'border-l-4 border-green-500' : ''
                }`}>
                  <div className="text-sm text-gray-500">Morning In</div>
                  <div className="font-semibold">
                    {todaysRecords.morningIn ? formatTime(todaysRecords.morningIn) : '--:--'}
                  </div>
                </div>
                <div className={`bg-white p-3 rounded-lg shadow-sm ${
                  todaysRecords.morningOut ? 'border-l-4 border-green-500' : ''
                }`}>
                  <div className="text-sm text-gray-500">Morning Out</div>
                  <div className="font-semibold">
                    {todaysRecords.morningOut ? formatTime(todaysRecords.morningOut) : '--:--'}
                  </div>
                </div>
                <div className={`bg-white p-3 rounded-lg shadow-sm ${
                  todaysRecords.afternoonIn ? 'border-l-4 border-green-500' : ''
                }`}>
                  <div className="text-sm text-gray-500">Afternoon In</div>
                  <div className="font-semibold">
                    {todaysRecords.afternoonIn ? formatTime(todaysRecords.afternoonIn) : '--:--'}
                  </div>
                </div>
                <div className={`bg-white p-3 rounded-lg shadow-sm ${
                  todaysRecords.afternoonOut ? 'border-l-4 border-green-500' : ''
                }`}>
                  <div className="text-sm text-gray-500">Afternoon Out</div>
                  <div className="font-semibold">
                    {todaysRecords.afternoonOut ? formatTime(todaysRecords.afternoonOut) : '--:--'}
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Total Hours Today</div>
                    <div className="font-semibold">
                      {todaysRecords.totalHours ? `${todaysRecords.totalHours} hrs` : '--:--'}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/dtr')}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Notifications</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
                <div className="flex items-start">
                  <div className="flex-shrink-0">🔔</div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Remember to record your afternoon time out before leaving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last sync: {currentTime.toLocaleTimeString()}
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}