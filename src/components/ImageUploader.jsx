import React, { useRef, useState } from 'react';
import inspireLabLogo from '../../inspirelab.png';

// Use Vite dev proxy to avoid browser CORS issues during local development
const N8N_WEBHOOK_URL = '/api/n8n-webhook';

export default function ImageUploader() {
  const fileInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const isEntryEnabled = Boolean(result) && !loading;

  // Handle image selection and local preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    } else {
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleReset = () => {
    setEmail('');
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send image binary to n8n Webhook
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail && !selectedFile) {
      setError('Please enter your email and select an image before uploading.');
      setResult(null);
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your email before uploading.');
      setResult(null);
      return;
    }

    if (!selectedFile) {
      setError('Please select an image before uploading.');
      setResult(null);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    // 'data' matches the binary property expected by n8n downstream nodes
    formData.append('data', selectedFile);
    formData.append('email', trimmedEmail);
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

  const renderTextWithLinks = (value) => {
    const text = String(value ?? '');
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    // console.log('Parts after splitting by URL pattern:', parts);
    const imagePattern = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?(#.*)?$/i;

    return parts.map((part, index) => {
      const cleanedUrl = part.replace(/[\],)\}."']+$/g, '');
      console.log('Cleaned URL:', cleanedUrl);
      const trailingText = part.slice(cleanedUrl.length);
      console.log('Trailing text:', trailingText);
      const isUrl = /^https?:\/\/[^\s]+$/i.test(cleanedUrl);

      if (!isUrl) {
        return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
      }

      const isImageUrl = imagePattern.test(cleanedUrl);

      if (isImageUrl) {
        return (
          <div
            key={`img-${index}`}
            style={{
              display: 'inline-block',
              width: 'calc(50% - 8px)',
              margin: '4px',
              verticalAlign: 'top',
            }}
          >
            <img
              src={cleanedUrl}
              alt="Workflow result"
              style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: '4px' }}
            />
            {trailingText}
          </div>
        );
      }

      return (
        <React.Fragment key={`url-${index}`}>
          <a href={cleanedUrl} target="_blank" rel="noopener noreferrer">
            {cleanedUrl}
          </a>
          {trailingText}
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ maxWidth: '420px', margin: '20px auto', padding: '20px', border: 'none', backgroundColor: '#06fc12', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <img
          src={inspireLabLogo}
          alt="InspireLab logo"
          style={{ width: '120px', height: 'auto' }}
        />
      </div>
      <h2>Identify People from Image</h2>

      {/* Description */}
      <p>Enter your email address. Then select an image to identify people in it. The image will be sent to the n8n workflow for processing, and cropped faces will be sent to you via email.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginTop: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '85%', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Email <span style={{ color: '#dc2626' }}>*</span>
            </label>
          <input 
            type="email" 
            placeholder="Enter your email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: loading ? '#f5f5f5' : '#fff', cursor: loading ? 'not-allowed' : 'text' }}
          />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Image <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            disabled={loading} 
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

        {/* <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onClick={handleReset}
            disabled={loading || isEntryEnabled}
            style={{ padding: '10px 14px', backgroundColor: loading || isEntryEnabled ? '#e5e5e5' : '#f2f2f2', color: '#333', border: '1px solid #d0d0d0', borderRadius: '4px', cursor: loading || isEntryEnabled ? 'not-allowed' : 'pointer' }}
          >
            Reset Email
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading || isEntryEnabled}
            style={{ padding: '10px 14px', backgroundColor: loading || isEntryEnabled ? '#e5e5e5' : '#f2f2f2', color: '#333', border: '1px solid #d0d0d0', borderRadius: '4px', cursor: loading || isEntryEnabled ? 'not-allowed' : 'pointer' }}
          >
            Reset Image
          </button>
        </div> */}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ flex: 1, padding: '10px', backgroundColor: loading ? '#ccc' : '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Processing...' : 'Upload & Identify'}
          </button>

          {/* <button
            type="button"
            onClick={handleReset}
            disabled={!isEntryEnabled}
            style={{ padding: '10px 14px', backgroundColor: isEntryEnabled ? '#f2f2f2' : '#e5e5e5', color: '#333', border: '1px solid #d0d0d0', borderRadius: '4px', cursor: isEntryEnabled ? 'pointer' : 'not-allowed' }}
          >
            Retry
          </button> */}
        </div>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '15px' }}>
          <p>Error: {error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
          {/* <h4>Workflow Response:</h4> */}
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {renderTextWithLinks(typeof result === 'string' ? result : JSON.stringify(result, null, 2))}
          </div>
        </div>
      )}
    </div>
  );
}