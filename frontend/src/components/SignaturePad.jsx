import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ onSignatureComplete, onCancel, loading = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;
    
    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e) => {
    if (loading) return;
    
    setIsDrawing(true);
    setHasSignature(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || loading) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Touch events for mobile support
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvasRef.current.dispatchEvent(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvasRef.current.dispatchEvent(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvasRef.current.dispatchEvent(mouseEvent);
  };

  const clearSignature = () => {
    if (loading) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear and reset background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!hasSignature || loading) return;
    
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    
    if (onSignatureComplete) {
      onSignatureComplete(dataURL);
    }
  };

  return (
    <div className="signature-pad-container">
      {/* Canvas for signature */}
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="text-center mb-2">
          <p className="text-sm text-gray-600">Sign in the box below</p>
        </div>
        
        <canvas
          ref={canvasRef}
          className="border border-gray-400 bg-white rounded cursor-crosshair mx-auto block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
        
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            Use your mouse or finger to sign above
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={clearSignature}
          disabled={loading || !hasSignature}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded transition-colors"
        >
          🗑️ Clear
        </button>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded transition-colors"
          >
            ❌ Cancel
          </button>
          
          <button
            type="button"
            onClick={saveSignature}
            disabled={loading || !hasSignature}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded font-semibold transition-colors"
          >
            {loading ? '⏳ Generating PDF...' : '✅ Complete Application'}
          </button>
        </div>
      </div>

      {!hasSignature && (
        <div className="mt-2 text-center">
          <p className="text-sm text-amber-600">
            ⚠️ Please provide your signature to continue
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Generating your PDF with signature...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;