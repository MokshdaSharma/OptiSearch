import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Search, Activity, TrendingUp, Clock } from 'lucide-react';
import { documentAPI, jobAPI } from '../api';
import { useSocket } from '../contexts/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('job:update', handleJobUpdate);
      socket.on('document:update', handleDocumentUpdate);

      return () => {
        socket.off('job:update', handleJobUpdate);
        socket.off('document:update', handleDocumentUpdate);
      };
    }
  }, [socket]);

  const handleJobUpdate = (data) => {
    console.log('Job update:', data);
    loadDashboardData();
  };

  const handleDocumentUpdate = (data) => {
    console.log('Document update:', data);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      const [docsResponse, jobsResponse] = await Promise.all([
        documentAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        jobAPI.getAll()
      ]);

      setRecentDocuments(docsResponse.data.documents);
      setRecentJobs(jobsResponse.data.jobs.slice(0, 5));

      // Calculate stats
      const allDocs = docsResponse.data.documents;
      setStats({
        totalDocuments: docsResponse.data.pagination.total,
        processing: allDocs.filter(d => d.status === 'processing').length,
        completed: allDocs.filter(d => d.status === 'completed').length,
        failed: allDocs.filter(d => d.status === 'failed').length
      });
    } catch (error) {
      console.error('Load dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text)' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>
          Welcome back, Mokshda! Here's an overview of your documents.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.75rem', fontWeight: '500' }}>
                Total Documents
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                {stats.totalDocuments}
              </p>
            </div>
            <div style={{ 
              background: 'rgba(79, 70, 229, 0.1)', 
              padding: '1.25rem', 
              borderRadius: '1rem' 
            }}>
              <FileText size={36} color="var(--primary)" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.75rem', fontWeight: '500' }}>
                Processing
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                {stats.processing}
              </p>
            </div>
            <div style={{ 
              background: 'rgba(79, 70, 229, 0.1)', 
              padding: '1.25rem', 
              borderRadius: '1rem' 
            }}>
              <Activity size={36} color="var(--primary)" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.75rem', fontWeight: '500' }}>
                Completed
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
                {stats.completed}
              </p>
            </div>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '1.25rem', 
              borderRadius: '1rem' 
            }}>
              <TrendingUp size={36} color="var(--success)" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '0.75rem', fontWeight: '500' }}>
                Failed
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                {stats.failed}
              </p>
            </div>
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              padding: '1.25rem', 
              borderRadius: '1rem' 
            }}>
              <Clock size={36} color="var(--danger)" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '3rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={18} />
            Upload Document
          </Link>
          <Link to="/search" className="btn btn-outline">
            <Search size={18} />
            Search Documents
          </Link>
          <Link to="/documents" className="btn btn-outline">
            <FileText size={18} />
            View All Documents
          </Link>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="card" style={{ marginBottom: '3rem', padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Recent Documents
          </h2>
          <Link to="/documents" style={{ 
            color: 'var(--primary)', 
            fontSize: '0.875rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            View All →
          </Link>
        </div>

        {recentDocuments.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No documents yet. Upload your first document to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentDocuments.map(doc => (
              <Link
                key={doc._id}
                to={`/documents/${doc._id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'var(--bg)',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <FileText size={20} color="var(--primary)" />
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {doc.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                      {doc.totalPages} {doc.totalPages === 1 ? 'page' : 'pages'} • 
                      {' '}{new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusBadge(doc.status)}`}>
                  {doc.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Recent Jobs
          </h2>
          <Link to="/jobs" style={{ 
            color: 'var(--primary)', 
            fontSize: '0.875rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            View All →
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No jobs yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentJobs.map(job => (
              <div
                key={job._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'var(--bg)',
                  borderRadius: '0.5rem'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                    {job.type.replace('_', ' ').toUpperCase()}
                  </p>
                  {job.status === 'processing' && (
                    <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${job.progress.percentage}%` }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                    {job.progress.percentage}% complete
                  </p>
                </div>
                <span className={`badge ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
