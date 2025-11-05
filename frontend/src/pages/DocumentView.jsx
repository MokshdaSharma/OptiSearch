import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { documentAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentView = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      const [docRes, pagesRes] = await Promise.all([
        documentAPI.getById(id),
        documentAPI.getPages(id)
      ]);
      setDocument(docRes.data.document);
      setPages(pagesRes.data.pages);
      if (pagesRes.data.pages.length > 0) {
        setSelectedPage(pagesRes.data.pages[0]);
      }
    } catch (error) {
      console.error('Load document error:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (pageNumbers) => {
    try {
      await documentAPI.reprocess(id, { pageNumbers });
      toast.success('Reprocessing job created');
      setTimeout(() => loadDocument(), 1000);
    } catch (error) {
      console.error('Reprocess error:', error);
      toast.error('Failed to create reprocess job');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!document) return <div className="container" style={{ padding: '2rem' }}>Document not found</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Link to="/documents" className="btn btn-outline btn-sm mb-4">
        <ArrowLeft size={16} /> Back to Documents
      </Link>

      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>{document.title}</h1>
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem' }}>
              {document.totalPages} pages • {document.fileType.toUpperCase()} • 
              Confidence: {document.averageConfidence.toFixed(1)}%
            </p>
            {(document.status === 'processing' || document.status === 'queued' || document.status === 'partial') && (
              <div style={{ marginTop: '1rem', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>OCR Progress</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                    {document.processingProgress || 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${document.processingProgress || 0}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.5rem' }}>
                  {document.processedPages || 0} of {document.totalPages} pages processed
                </p>
              </div>
            )}
          </div>
          <span className={`badge ${document.status === 'completed' ? 'badge-success' : document.status === 'processing' ? 'badge-primary' : document.status === 'partial' ? 'badge-warning' : 'badge-warning'}`}>
            {document.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Pages</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            {pages.map(page => (
              <div
                key={page._id}
                onClick={() => setSelectedPage(page)}
                style={{
                  padding: '0.75rem',
                  background: selectedPage?._id === page._id ? 'var(--primary)' : 'var(--bg)',
                  color: selectedPage?._id === page._id ? 'var(--white)' : 'inherit',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Page {page.pageNumber}</span>
                  <span style={{ fontSize: '0.75rem' }}>{page.confidence.toFixed(0)}%</span>
                </div>
                {page.status === 'low_quality' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReprocess([page.pageNumber]); }}
                    className="btn btn-sm btn-outline mt-2"
                    style={{ width: '100%', fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={12} /> Reprocess
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          {selectedPage ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Page {selectedPage.pageNumber}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${selectedPage.confidence < 60 ? 'badge-warning' : 'badge-success'}`}>
                    {selectedPage.confidence.toFixed(1)}% confidence
                  </span>
                  {selectedPage.status === 'low_quality' && (
                    <button
                      onClick={() => handleReprocess([selectedPage.pageNumber])}
                      className="btn btn-sm btn-outline"
                    >
                      <RefreshCw size={14} /> Reprocess
                    </button>
                  )}
                </div>
              </div>
              <div style={{
                background: 'var(--bg)',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                maxHeight: '600px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}>
                {selectedPage.text || 'No text extracted'}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <FileText size={48} color="var(--gray)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--gray)' }}>Select a page to view content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
