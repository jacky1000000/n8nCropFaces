import React, { useState } from 'react';

// Use Vite dev proxy to avoid browser CORS issues during local development
const N8N_WEBHOOK_URL = '/api/n8n-webhook';

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle image selection and local preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  // Send image binary to n8n Webhook
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    // 'data' matches the binary property expected by n8n downstream nodes
    formData.append('data', selectedFile);
    console.log('Sending file to n8n Webhook:', selectedFile);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData, // Do NOT manually set 'Content-Type'; fetch sets boundary automatically
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server returned status ${response.status}${errorBody ? `: ${errorBody}` : ''}`);
      }

      const responseText = await response.text();
      const contentType = response.headers.get('content-type') || '';

      // n8n may return either JSON or plain text depending on workflow configuration.
      const data = contentType.includes('application/json')
        ? JSON.parse(responseText)
        : responseText;

      console.log('response data: ', data);
      setResult(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '20px auto', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <h2>Identify People from Image</h2>

      {/* Description */}
      <p>Select an image to identify people in it. The image will be sent to the n8n workflow for processing.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        {preview && (
          <div style={{ marginBottom: '15px' }}>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '4px' }} 
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={!selectedFile || loading}
          style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#ccc' : '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : 'Upload & Identify'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '15px' }}>
          <p>Error: {error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
          {/* <h4>Workflow Response:</h4> */}
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}