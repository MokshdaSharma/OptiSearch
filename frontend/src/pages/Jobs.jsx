import React, { useState, useEffect } from 'react';
import { Activity, X } from 'lucide-react';
import { jobAPI } from '../api';
import { useSocket } from '../contexts/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { socket } = useSocket();

  useEffect(() => {
    loadJobs();
  }, [filter]);

  useEffect(() => {
    if (socket) {
      socket.on('job:update', handleJobUpdate);
      return () => socket.off('job:update', handleJobUpdate);
    }
  }, [socket]);

  const handleJobUpdate = (data) => {
    setJobs(prev => prev.map(job =>
      job._id === data.jobId ? { ...job, ...data } : job
    ));
  };

  const loadJobs = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await jobAPI.getAll(params);
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Load jobs error:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (jobId) => {
    try {
      await jobAPI.cancel(jobId);
      toast.success('Job cancelled');
      loadJobs();
    } catch (error) {
      console.error('Cancel job error:', error);
      toast.error('Failed to cancel job');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'badge-success',
      processing: 'badge-primary',
      failed: 'badge-danger',
      queued: 'badge-warning',
      cancelled: 'badge-gray'
    };
    return badges[status] || 'badge-gray';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Processing Jobs
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>
          Monitor OCR processing jobs in real-time
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'queued', 'processing', 'completed', 'failed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 3rem' }}>
          <Activity size={64} color="var(--gray)" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No jobs found</h3>
          <p style={{ color: 'var(--gray)' }}>Upload documents to start processing jobs</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {jobs.map(job => (
            <div key={job._id} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <Activity size={20} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                      {job.type.replace('_', ' ').toUpperCase()}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginLeft: '2.5rem' }}>
                    {job.document?.title || 'Document deleted'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                  {(job.status === 'queued' || job.status === 'processing') && (
                    <button onClick={() => handleCancel(job._id)} className="btn btn-danger btn-sm">
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </div>

              {job.status === 'processing' && (
                <>
                  <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                    <div className="progress-bar-fill" style={{ width: `${job.progress.percentage}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--gray)' }}>
                    <span style={{ fontWeight: '500' }}>{job.progress.percentage}% complete</span>
                    <span>{job.progress.current} / {job.progress.total} pages</span>
                    {job.estimatedTimeRemaining && (
                      <span>~{Math.ceil(job.estimatedTimeRemaining / 60)}m remaining</span>
                    )}
                  </div>
                </>
              )}

              {job.status === 'completed' && (
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--success)', 
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500'
                }}>
                  ✓ Completed in {(job.result.totalProcessingTime / 1000).toFixed(1)}s • 
                  Avg confidence: {job.result.averageConfidence.toFixed(0)}%
                </div>
              )}

              {job.status === 'failed' && job.error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--danger)',
                  fontWeight: '500'
                }}>
                  ✕ Error: {job.error.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
