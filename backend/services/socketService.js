/**
 * Setup Socket.IO event handlers
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join user-specific room for targeted updates
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join document-specific room
    socket.on('join:document', (documentId) => {
      socket.join(`document:${documentId}`);
      console.log(`Socket ${socket.id} joined document room: ${documentId}`);
    });

    // Leave document room
    socket.on('leave:document', (documentId) => {
      socket.leave(`document:${documentId}`);
      console.log(`Socket ${socket.id} left document room: ${documentId}`);
    });

    // Join job-specific room
    socket.on('join:job', (jobId) => {
      socket.join(`job:${jobId}`);
      console.log(`Socket ${socket.id} joined job room: ${jobId}`);
    });

    // Leave job room
    socket.on('leave:job', (jobId) => {
      socket.leave(`job:${jobId}`);
      console.log(`Socket ${socket.id} left job room: ${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit job progress update to specific job room
 */
function emitJobProgress(io, jobId, progress) {
  io.to(`job:${jobId}`).emit('job:progress', progress);
}

/**
 * Emit document update to specific document room
 */
function emitDocumentUpdate(io, documentId, update) {
  io.to(`document:${documentId}`).emit('document:update', update);
}

/**
 * Emit notification to specific user
 */
function emitUserNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification', notification);
}

module.exports = {
  setupSocketHandlers,
  emitJobProgress,
  emitDocumentUpdate,
  emitUserNotification
};
