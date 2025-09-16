import React from 'react';
import { useNavigate } from 'react-router-dom';

const Associations = () => {
  const navigate = useNavigate();

  const handleAddAssociation = () => {
    console.log('Button clicked'); // Debug log
    try {
      navigate('/associations/add');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Associations</h1>
        <button
          onClick={handleAddAssociation}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add association
        </button>
      </div>
      {/* Rest of your component */}
    </div>
  );
};

export default Associations;
