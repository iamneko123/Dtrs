import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


export default function AdminDashboard() {
  const [dtrs, setDtrs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    role: 'employee',
    password: '',
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

 // Logout function
const handleLogout = () => {
      localStorage.removeItem('token'); // Remove saved token
      window.location.href = '/login';  // Redirect to login page
    };
    

  const fetchDTRs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/dtr/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDtrs(response.data);
    } catch (error) {
      console.error('Error fetching DTRs:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        handleLogout();
      } else {
        alert('Failed to load employees. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchDTRs();
    fetchEmployees();
  }, []);

  const handleDownloadPDF = () => {
      try {
        if (dtrs.length === 0) {
          alert('No records available to download');
          return;
        }
    
        // Create new PDF instance
        const doc = new jsPDF();
    
        // Add title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Daily Time Records Report', 105, 15, { align: 'center' });
    
        // Prepare table data
        const headers = [
          'Employee',
          'Date', 
          'Morning In',
          'Morning Out',
          'Afternoon In',
          'Afternoon Out'
        ];
    
        const data = dtrs.map(record => [
          record.userId?.username || 'Unknown',
          new Date(record.date).toLocaleDateString() || '-',
          record.morningIn ? formatTime(record.morningIn) : '-',
          record.morningOut ? formatTime(record.morningOut) : '-',
          record.afternoonIn ? formatTime(record.afternoonIn) : '-',
          record.afternoonOut ? formatTime(record.afternoonOut) : '-'
        ]);
    
        // Add table
        autoTable(doc, { 
          head: [headers],
          body: data,
          startY: 25,
          margin: { top: 20 },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [51, 102, 153],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 }
          }
        });
    
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `Page ${i} of ${pageCount}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
    
        // Save the PDF
        doc.save(`DTR_Report_${new Date().toISOString().slice(0,10)}.pdf`);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    };
    
    // Helper function to format time
    const formatTime = (timeString) => {
      try {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
      } catch {
        return timeString;
      }
    };
  const handleAddEmployee = async () => {
      if (!newEmployee.username || !newEmployee.password) {
        alert('Please fill all required fields');
        return;
      }
    
      try {
        await axios.post('http://localhost:5000/api/users/add', newEmployee, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Employee added successfully');
        setNewEmployee({ username: '', role: 'employee', password: '' });
        fetchEmployees();
      } catch (error) {
        console.error('Error adding employee:', error);
        if (error.response?.data?.message.includes('username')) {
          alert('Username already exists. Please choose a different username.');
        } else {
          alert('Error adding employee. Please try again.');
        }
      }
    };

  const handleEditEmployee = (employee) => {
    setEditingId(employee._id);
    setNewEmployee({
      username: employee.username,
      role: employee.role,
      password: ''
    });
  };

  const handleUpdateEmployee = async () => {
    if (!newEmployee.username) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/users/edit/${editingId}`,
        newEmployee,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      alert('Employee updated successfully');
      setNewEmployee({ username: '', role: 'employee', password: '' });
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(error.response?.data?.message || 'Error updating employee');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/users/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(error.response?.data?.message || 'Error deleting employee');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewEmployee({ username: '', role: 'employee', password: '' });
  };

  return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
          >
            Logout
          </button>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DTR Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-700">Daily Time Records</h2>
              <button 
                onClick={handleDownloadPDF} 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export as PDF
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Morning In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Morning Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Afternoon In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Afternoon Out</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dtrs.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.userId?.username || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${record.morningIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.morningIn || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${record.morningOut ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.morningOut || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${record.afternoonIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.afternoonIn || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${record.afternoonOut ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.afternoonOut || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Employee Management Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-700">
                  {editingId ? 'Edit Employee' : 'Add New Employee'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={newEmployee.username}
                    onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingId ? "New Password (leave blank to keep current)" : "Password"}
                  </label>
                  <input
                    type="password"
                    placeholder={editingId ? "Enter new password" : "Enter password"}
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required={!editingId}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  {editingId ? (
                    <>
                      <button
                        onClick={handleUpdateEmployee}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                      >
                        Update Employee
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddEmployee}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                    >
                      Add Employee
                    </button>
                  )}
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-700">Employee List</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {employee.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee._id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }