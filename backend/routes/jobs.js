const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getJobStatus, getUserJobs, cancelJob } = require('../services/jobQueue');

/**
 * Get all jobs for current user
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const jobs = await getUserJobs(req.user._id, status);
    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * Get specific job status
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await getJobStatus(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check ownership
    if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

/**
 * Cancel job
 */
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const job = await getJobStatus(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check ownership
    if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cancelledJob = await cancelJob(req.params.id);
    res.json({ 
      message: 'Job cancelled successfully',
      job: cancelledJob 
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

module.exports = router;
