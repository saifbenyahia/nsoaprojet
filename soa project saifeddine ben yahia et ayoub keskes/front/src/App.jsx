import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, X, Users, Mail, Phone, Briefcase, Building2, Calendar, AlertCircle, CheckCircle, Wifi } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/Person_backend/api/persons';

// ==================== API FUNCTIONS ====================

// 1. Get all persons
const getAllPersons = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching all persons:', error);
    throw error;
  }
};

// 2. Get person by ID
const getPersonById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Person with ID ${id} not found`);
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching person with ID ${id}:`, error);
    throw error;
  }
};

// 3. Search persons by name
const searchPersonsByName = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error searching persons by name "${name}":`, error);
    throw error;
  }
};

// 4. Search persons by department
const searchPersonsByDepartment = async (department) => {
  try {
    const response = await fetch(`${API_BASE_URL}/department?name=${encodeURIComponent(department)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error searching persons by department "${department}":`, error);
    throw error;
  }
};

// 5. Create new person
const createPerson = async (personData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating person:', error);
    throw error;
  }
};

// 6. Update person (full update with PUT)
const updatePerson = async (id, personData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating person with ID ${id}:`, error);
    throw error;
  }
};

// 7. Delete person
const deletePerson = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return { success: true, message: 'Person deleted successfully' };
  } catch (error) {
    console.error(`Error deleting person with ID ${id}:`, error);
    throw error;
  }
};

// 8. Get persons count
const getPersonsCount = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/count`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting persons count:', error);
    throw error;
  }
};

// 9. Test API connection
const testApiConnection = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      message: `✅ Connection successful! Found ${data.length} persons.`,
      data: data
    };
  } catch (error) {
    console.error('API connection test failed:', error);
    
    // Check for CORS errors
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`❌ CORS/Network error. Check if:
        1. Backend is running on http://localhost:8080
        2. CORS is properly configured
        3. You can access ${API_BASE_URL} in browser`);
    }
    
    throw error;
  }
};

// ==================== REACT COMPONENT ====================

export default function PersonManagementApp() {
  // State declarations
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    dateEmbauche: ''
  });

  // ==================== DATA FETCHING FUNCTIONS ====================

  const handleFetchAllPersons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllPersons();
      setPersons(data);
    } catch (err) {
      setError(`Failed to load persons: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchPersons = useCallback(async () => {
    if (!searchTerm.trim()) {
      handleFetchAllPersons();
      return;
    }

    setLoading(true);
    setError('');
    try {
      let data;
      if (searchType === 'name') {
        data = await searchPersonsByName(searchTerm.trim());
      } else {
        data = await searchPersonsByDepartment(searchTerm.trim());
      }
      setPersons(data || []);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, handleFetchAllPersons]);

  const handleCreatePerson = async (personData) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'age', 'nom', 'prenom', 'email'];
      for (const field of requiredFields) {
        if (!personData[field]?.toString().trim()) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Age validation
      const age = parseInt(personData.age);
      if (isNaN(age) || age <= 0) {
        throw new Error('Age must be a positive number');
      }

      // Prepare payload
      const payload = {
        ...personData,
        age: age,
        name: personData.name.trim(),
        nom: personData.nom.trim(),
        prenom: personData.prenom.trim(),
        email: personData.email.trim(),
        telephone: personData.telephone?.trim() || '',
        poste: personData.poste?.trim() || '',
        departement: personData.departement?.trim() || '',
        dateEmbauche: personData.dateEmbauche || ''
      };

      const result = await createPerson(payload);
      setSuccessMessage('Person created successfully!');
      handleFetchAllPersons();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePerson = async (id, personData) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'age', 'nom', 'prenom', 'email'];
      for (const field of requiredFields) {
        if (!personData[field]?.toString().trim()) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Age validation
      const age = parseInt(personData.age);
      if (isNaN(age) || age <= 0) {
        throw new Error('Age must be a positive number');
      }

      // Prepare payload
      const payload = {
        ...personData,
        age: age,
        name: personData.name.trim(),
        nom: personData.nom.trim(),
        prenom: personData.prenom.trim(),
        email: personData.email.trim(),
        telephone: personData.telephone?.trim() || '',
        poste: personData.poste?.trim() || '',
        departement: personData.departement?.trim() || '',
        dateEmbauche: personData.dateEmbauche || ''
      };

      const result = await updatePerson(id, payload);
      setSuccessMessage('Person updated successfully!');
      handleFetchAllPersons();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this person?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const result = await deletePerson(id);
      setSuccessMessage('Person deleted successfully!');
      handleFetchAllPersons();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetPersonById = async (id) => {
    setLoading(true);
    setError('');
    
    try {
      const person = await getPersonById(id);
      return person;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetPersonsCount = async () => {
    try {
      const result = await getPersonsCount();
      setSuccessMessage(`Total persons in database: ${result.count}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const result = await testApiConnection();
      setSuccessMessage(result.message);
      handleFetchAllPersons();
      setTimeout(() => setSuccessMessage(''), 3000);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UI EVENT HANDLERS ====================

  useEffect(() => {
    handleFetchAllPersons();
  }, [handleFetchAllPersons]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearchPersons();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearchPersons]);

  const handleEditClick = async (person) => {
    try {
      // Option 1: Use the person object directly from the list
      setEditingPerson(person);
      setFormData({
        name: person.name || '',
        age: person.age?.toString() || '',
        nom: person.nom || '',
        prenom: person.prenom || '',
        email: person.email || '',
        telephone: person.telephone || '',
        poste: person.poste || '',
        departement: person.departement || '',
        dateEmbauche: person.dateEmbauche || ''
      });
      
      // Option 2: Fetch fresh data from API
      // const freshPerson = await handleGetPersonById(person.id);
      // setEditingPerson(freshPerson);
      // setFormData({ ...freshPerson, age: freshPerson.age?.toString() || '' });
      
      setShowModal(true);
    } catch (err) {
      setError(`Failed to load person details: ${err.message}`);
    }
  };

  const handleSubmitForm = async () => {
    try {
      if (editingPerson) {
        await handleUpdatePerson(editingPerson.id, formData);
      } else {
        await handleCreatePerson(formData);
      }
      handleCloseModal();
    } catch (err) {
      // Error is already set in the handler functions
    }
  };

  const handleDeleteClick = async (id) => {
    try {
      await handleDeletePerson(id);
    } catch (err) {
      // Error is already set in the handler functions
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerson(null);
    setFormData({
      name: '',
      age: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      poste: '',
      departement: '',
      dateEmbauche: ''
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    handleFetchAllPersons();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderPersonCard = (person) => (
    <div key={person.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:scale-[1.02] animate-fadeIn group">
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 h-3"></div>
      <div className="p-6 bg-gradient-to-br from-white to-purple-50/30">
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{person.name}</h3>
            <p className="text-gray-700 font-medium mb-2">{person.prenom} {person.nom}</p>
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-semibold shadow-sm">
              Age: {person.age}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditClick(person)}
              className="p-2.5 text-purple-600 hover:bg-purple-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
              title="Edit"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(person.id)}
              className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium text-gray-800 truncate">{person.email}</p>
            </div>
          </div>

          {person.telephone && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Phone</p>
                <p className="text-sm font-medium text-gray-800">{person.telephone}</p>
              </div>
            </div>
          )}

          {person.poste && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-md">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Position</p>
                <p className="text-sm font-medium text-gray-800">{person.poste}</p>
              </div>
            </div>
          )}

          {person.departement && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Department</p>
                <p className="text-sm font-medium text-gray-800">{person.departement}</p>
              </div>
            </div>
          )}

          {person.dateEmbauche && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100">
              <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide">Hire Date</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(person.dateEmbauche)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-purple-100">
          <p className="text-xs text-gray-500 font-mono">ID: {person.id}</p>
        </div>
      </div>
    </div>
  );

  const renderMessage = (type, message) => {
    if (!message) return null;
    
    const config = {
      error: {
        bg: 'bg-gradient-to-r from-rose-50 to-red-50',
        border: 'border-rose-300',
        text: 'text-rose-800',
        icon: <AlertCircle className="w-6 h-6 text-rose-500" />
      },
      success: {
        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        border: 'border-emerald-300',
        text: 'text-emerald-800',
        icon: <CheckCircle className="w-6 h-6 text-emerald-500" />
      }
    }[type];

    return (
      <div className={`mb-6 p-5 ${config.bg} border-2 ${config.border} rounded-2xl shadow-lg animate-fadeIn`}>
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {config.icon}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${config.text} text-base`}>{message}</p>
          </div>
          <button
            onClick={() => type === 'error' ? setError('') : setSuccessMessage('')}
            className="text-gray-500 hover:text-gray-700 hover:bg-white/50 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-purple-100 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                  Person Management System
                </h1>
                <p className="text-gray-700 text-base font-medium">Manage your personnel database efficiently</p>
                <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 px-2 py-1 rounded inline-block">API: {API_BASE_URL}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleTestConnection}
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                <Wifi className="w-5 h-5" />
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleGetPersonsCount}
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Get Count
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                <Plus className="w-5 h-5" /> Add Person
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Search Persons</label>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={`Search by ${searchType === 'name' ? 'name' : 'department'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchPersons()}
                      className="w-full px-5 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <button
                    onClick={handleSearchPersons}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                  >
                    Search
                  </button>
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Search Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchType('name')}
                    className={`px-5 py-3 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 ${
                      searchType === 'name' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    By Name
                  </button>
                  <button
                    onClick={() => setSearchType('department')}
                    className={`px-5 py-3 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 ${
                      searchType === 'department' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    By Department
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
              <p className="font-semibold mb-2 text-purple-700">Available API Endpoints:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <code className="bg-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm border border-purple-200">GET /persons</code>
                <code className="bg-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm border border-purple-200">POST /persons</code>
                <code className="bg-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm border border-purple-200">GET /persons/search</code>
                <code className="bg-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm border border-purple-200">GET /persons/department</code>
                <code className="bg-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm border border-purple-200">GET /persons/count</code>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {renderMessage('error', error)}
        {renderMessage('success', successMessage)}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 text-center border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <p className="text-gray-600 mb-3 font-semibold uppercase tracking-wide text-sm">Total Persons</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{persons.length}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 text-center border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <p className="text-gray-600 mb-3 font-semibold uppercase tracking-wide text-sm">Search Type</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent capitalize">{searchType}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-xl p-6 text-center border border-emerald-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <p className="text-gray-600 mb-3 font-semibold uppercase tracking-wide text-sm">Status</p>
            <p className={`text-2xl font-bold ${
              loading 
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent' 
                : persons.length > 0 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent' 
                  : 'text-gray-600'
            }`}>
              {loading ? 'Loading...' : persons.length > 0 ? 'Connected' : 'Ready'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent shadow-lg"></div>
            <p className="mt-6 text-gray-700 font-semibold text-lg">Loading data...</p>
          </div>
        )}

        {/* Persons Grid */}
        {!loading && persons.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-16 text-center border border-purple-100 animate-fadeIn">
            <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Users className="w-20 h-20 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">No persons found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm ? `No results for "${searchTerm}"` : 'Start by adding your first person'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                <Plus className="w-5 h-5 inline mr-2" /> Add First Person
              </button>
              <button
                onClick={handleTestConnection}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                Test Connection
              </button>
            </div>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {persons.map(renderPersonCard)}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-100">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 h-2"></div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      {editingPerson ? 'Edit Person' : 'Add New Person'}
                    </h2>
                    <p className="text-gray-600 text-base">
                      {editingPerson ? 'Update person details' : 'Fill in the required information'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2.5 hover:bg-purple-100 rounded-xl transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {[
                    { name: 'name', label: 'Name *', type: 'text' },
                    { name: 'age', label: 'Age *', type: 'number', min: 1 },
                    { name: 'nom', label: 'Nom (Last Name) *', type: 'text' },
                    { name: 'prenom', label: 'Prenom (First Name) *', type: 'text' },
                    { name: 'email', label: 'Email *', type: 'email' },
                    { name: 'telephone', label: 'Phone', type: 'tel' },
                    { name: 'poste', label: 'Position', type: 'text' },
                    { name: 'departement', label: 'Department', type: 'text' },
                  ].map(field => (
                    <div key={field.name} className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        min={field.min}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm"
                        required={field.label.includes('*')}
                      />
                    </div>
                  ))}
                  
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Hire Date (yyyy-mm-dd)
                    </label>
                    <input
                      type="date"
                      name="dateEmbauche"
                      value={formData.dateEmbauche}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-medium">Format: yyyy-mm-dd (e.g., 2024-01-15)</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t-2 border-purple-100">
                  <button
                    onClick={handleSubmitForm}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingPerson ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : editingPerson ? 'Update Person' : 'Create Person'}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 text-lg">Form Validation Rules:</h4>
                  <ul className="text-sm text-blue-700 space-y-2 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Fields marked with * are required
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Email must be in valid format
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Age must be a positive number
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Email must be unique (not already in database)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Hire date must be in yyyy-mm-dd format
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-600">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-purple-100">
            <p className="mb-2 font-semibold">Backend API: <code className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-lg text-xs font-mono border border-purple-200">{API_BASE_URL}</code></p>
            <p className="text-gray-700 font-medium">Built with React • Connected to Java/Jersey Backend</p>
            <div className="mt-5 flex gap-3 justify-center">
              <button
                onClick={() => window.open(API_BASE_URL, '_blank')}
                className="text-sm px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg font-semibold transform hover:scale-105"
              >
                Test API in Browser
              </button>
              <button
                onClick={() => {
                  console.log('Current persons:', persons);
                  console.log('Current state:', { loading, error, successMessage, searchTerm, searchType });
                }}
                className="text-sm px-5 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold transform hover:scale-105"
              >
                Show Debug Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}