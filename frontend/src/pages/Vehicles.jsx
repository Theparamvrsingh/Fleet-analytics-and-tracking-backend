import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { vehicleApi } from '../services/api';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.getAll();
      setVehicles(response.data);
    } catch (error) {
      console.error("Failed to fetch vehicles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleApi.delete(id);
        fetchVehicles();
      } catch (error) {
        console.error("Failed to delete vehicle", error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Vehicles</h2>
          <p className="text-here-muted text-sm mt-1">Manage your fleet and add new vehicles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Add Vehicle</span>
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-here-border flex justify-between items-center bg-[#141d2b]">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-here-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search by Reg or Make..." 
              className="w-full bg-[#0f1621] border border-here-border rounded-md pl-9 pr-3 py-1.5 text-sm text-here-text focus:outline-none focus:border-here-teal"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1621] border-b border-here-border">
                <th className="p-4 text-xs font-semibold text-here-muted uppercase tracking-wider">Registration</th>
                <th className="p-4 text-xs font-semibold text-here-muted uppercase tracking-wider">Make & Model</th>
                <th className="p-4 text-xs font-semibold text-here-muted uppercase tracking-wider">Year</th>
                <th className="p-4 text-xs font-semibold text-here-muted uppercase tracking-wider">Owner</th>
                <th className="p-4 text-xs font-semibold text-here-muted uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-here-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-here-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-here-muted">Loading vehicles...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-here-muted">No vehicles found. Add one to get started.</td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-[#1a2536] transition-colors group">
                    <td className="p-4 font-mono text-sm text-white">{v.reg}</td>
                    <td className="p-4 text-sm text-here-text">{v.make} {v.model}</td>
                    <td className="p-4 text-sm text-here-muted">{v.year}</td>
                    <td className="p-4 text-sm text-here-text">{v.owner}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-[#141d2b] border ${
                        v.status === 'Active' ? 'text-here-neon border-here-neon/30' : 
                        v.status === 'Maintenance' ? 'text-orange-400 border-orange-400/30' : 
                        'text-here-muted border-here-border'
                      }`}>
                        {v.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-here-muted hover:text-here-teal rounded bg-[#0f1621] border border-here-border hover:border-here-teal transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 text-here-muted hover:text-red-400 rounded bg-[#0f1621] border border-here-border hover:border-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddVehicleModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchVehicles();
          }} 
        />
      )}
    </div>
  );
};

const AddVehicleModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reg: '',
    make: '',
    model: '',
    year: '',
    owner: '',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vehicleApi.create(formData);
      onSuccess();
    } catch (error) {
      console.error("Failed to add vehicle", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-here-card border border-here-border rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-here-border">
          <h3 className="text-lg font-bold text-white">Add New Vehicle</h3>
          <button onClick={onClose} className="text-here-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-here-muted mb-1 uppercase tracking-wider">Registration Number</label>
            <input 
              required
              name="reg"
              value={formData.reg}
              onChange={handleChange}
              className="input-field font-mono uppercase" 
              placeholder="e.g. MH12AB1234" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-here-muted mb-1 uppercase tracking-wider">Make</label>
              <input required name="make" value={formData.make} onChange={handleChange} className="input-field" placeholder="e.g. Volvo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-here-muted mb-1 uppercase tracking-wider">Model</label>
              <input required name="model" value={formData.model} onChange={handleChange} className="input-field" placeholder="e.g. FH16" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-here-muted mb-1 uppercase tracking-wider">Year</label>
              <input required name="year" type="number" value={formData.year} onChange={handleChange} className="input-field" placeholder="2023" />
            </div>
            <div>
              <label className="block text-xs font-medium text-here-muted mb-1 uppercase tracking-wider">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-here-muted mb-1 uppercase tracking-wider">Owner / Company</label>
            <input required name="owner" value={formData.owner} onChange={handleChange} className="input-field" placeholder="Logistics Inc." />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Vehicles;
