import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, File, X, Settings } from 'lucide-react';
import { documentAPI } from '../api';
import toast from 'react-hot-toast';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [language, setLanguage] = useState('eng');
  const [preprocessing, setPreprocessing] = useState({
    deskew: false,
    denoise: false,
    rotate: 0,
    binarize: false
  });
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxSize: 52428800, // 50MB
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('language', language);
        formData.append('preprocessingOptions', JSON.stringify(preprocessing));

        await documentAPI.upload(formData, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        });

        toast.success(`${file.name} uploaded successfully!`);
      }

      toast.success('All files uploaded successfully!');
      setTimeout(() => {
        navigate('/documents');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'chi_sim', name: 'Chinese Simplified' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' }
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Upload Documents
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>
          Upload PDFs or images to extract text with OCR
        </p>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        {/* Upload Area */}
        <div>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '0.75rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(79, 70, 229, 0.05)' : 'var(--white)',
              transition: 'all 0.2s'
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon 
              size={48} 
              color={isDragActive ? 'var(--primary)' : 'var(--gray)'} 
              style={{ margin: '0 auto 1rem' }}
            />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              or click to browse
            </p>
            <p style={{ color: 'var(--gray-light)', fontSize: '0.75rem' }}>
              Supported: PDF, JPG, PNG, TIFF (max 50MB)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Selected Files ({files.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--bg)',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <File size={20} color="var(--primary)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          fontWeight: '500', 
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadProgress[file.name] !== undefined && (
                          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                            <div 
                              className="progress-bar-fill" 
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          padding: '0.25rem'
                        }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div>
          <div className="card" style={{ padding: '2rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setShowOptions(!showOptions)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={20} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                  OCR Options
                </h3>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>
                {showOptions ? 'Hide' : 'Show'}
              </span>
            </div>

            <div className="form-group">
              <label className="label">Language</label>
              <select
                className="input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                Select the primary language of your documents
              </p>
            </div>

            {showOptions && (
              <>
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Image Preprocessing
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preprocessing.deskew}
                        onChange={(e) => setPreprocessing(prev => ({ ...prev, deskew: e.target.checked }))}
                      />
                      <span style={{ fontSize: '0.875rem' }}>Deskew (auto-rotate)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preprocessing.denoise}
                        onChange={(e) => setPreprocessing(prev => ({ ...prev, denoise: e.target.checked }))}
                      />
                      <span style={{ fontSize: '0.875rem' }}>Denoise (reduce noise)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preprocessing.binarize}
                        onChange={(e) => setPreprocessing(prev => ({ ...prev, binarize: e.target.checked }))}
                      />
                      <span style={{ fontSize: '0.875rem' }}>Binarize (black & white)</span>
                    </label>

                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                      <label className="label">Rotate (degrees)</label>
                      <select
                        className="input"
                        value={preprocessing.rotate}
                        onChange={(e) => setPreprocessing(prev => ({ ...prev, rotate: parseInt(e.target.value) }))}
                      >
                        <option value={0}>0°</option>
                        <option value={90}>90°</option>
                        <option value={180}>180°</option>
                        <option value={270}>270°</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{
                background: 'rgba(79, 70, 229, 0.05)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--dark)'
              }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>ℹ️ Processing Info</p>
                <p style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                  Files will be processed asynchronously. You can monitor progress in real-time 
                  from the Jobs page. OCR accuracy improves with higher quality images and 
                  appropriate preprocessing options.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            className="btn btn-primary w-full mt-4"
            disabled={uploading || files.length === 0}
            style={{ fontSize: '1rem', padding: '1rem' }}
          >
            {uploading ? (
              <>
                <div className="spinner" style={{ width: '1rem', height: '1rem' }} />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon size={20} />
                Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
