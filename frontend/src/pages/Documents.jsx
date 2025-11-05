import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Eye } from 'lucide-react';
import { documentAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [filter, page]);

  const loadDocuments = async () => {
    try {
      const params = { page, limit: 12 };
      if (filter !== 'all') params.status = filter;

      const response = await documentAPI.getAll(params);
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Load documents error:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentAPI.delete(id);
      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'badge-success',
      processing: 'badge-primary',
      failed: 'badge-danger',
      queued: 'badge-warning',
      uploaded: 'badge-gray'
    };
    return badges[status] || 'badge-gray';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>Documents</h1>
          <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>Manage your uploaded documents</p>
        </div>
        <Link to="/upload" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>Upload New</Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'completed', 'processing', 'queued', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 3rem' }}>
          <FileText size={64} color="var(--gray)" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No documents found</h3>
          <p style={{ color: 'var(--gray)' }}>Upload your first document to get started</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {documents.map(doc => (
              <div key={doc._id} className="card" style={{ padding: '2rem', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <FileText size={24} color="var(--primary)" />
                  </div>
                  <span className={`badge ${getStatusBadge(doc.status)}`}>{doc.status}</span>
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }} className="truncate">
                  {doc.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1.25rem' }}>
                  {doc.totalPages} pages • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                {doc.status === 'processing' && (
                  <div className="progress-bar mb-2">
                    <div className="progress-bar-fill" style={{ width: `${doc.processingProgress}%` }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/documents/${doc._id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    <Eye size={14} /> View
                  </Link>
                  <button onClick={() => handleDelete(doc._id)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '3rem', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline"
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: '500' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.totalPages}
                className="btn btn-outline"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Documents;
