# OptiSearch - OCR Document Search System

A comprehensive MERN stack application for uploading documents (PDFs/images), performing OCR text extraction using Tesseract.js, and enabling fast full-text search with MongoDB.

## Features

✅ **Upload & Validation**
- PDF and image upload (JPEG, PNG, TIFF)
- File type and size validation
- Hash-based duplicate detection
- Drag-and-drop interface

✅ **OCR Pipeline**
- Page-by-page OCR with Tesseract.js
- Multi-language support (12 languages)
- Image preprocessing (deskew, denoise, rotate, binarize)
- Confidence scoring per page

✅ **Asynchronous Processing**
- Job queue system with states (queued/processing/completed/failed)
- Real-time progress updates via WebSocket
- Resumable retries
- Job cancellation

✅ **Search & Indexing**
- MongoDB full-text search
- Relevance-ranked results
- Search filters (file type, confidence, date)
- Hit highlighting and page previews

✅ **Quality Controls**
- Low-confidence page flagging
- Re-process pages with different settings
- Per-page confidence scores

✅ **Professional UI**
- Modern, responsive design
- Real-time dashboard
- Toast notifications
- Progress tracking

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Tesseract.js (OCR)
- Socket.IO (real-time updates)
- Sharp (image processing)
- JWT authentication

**Frontend:**
- React 18
- Vite
- React Router
- Axios
- Socket.IO Client
- React Dropzone
- Lucide Icons

## Installation

### Prerequisites
- Node.js 16+
- MongoDB Atlas account (credentials already configured)

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Environment Variables

Backend `.env` is already configured with:
- MongoDB connection string
- JWT secret
- Port configuration
- Upload settings

## Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Documents**: 
   - Navigate to Upload page
   - Drag & drop or select files
   - Choose OCR language and preprocessing options
   - Click Upload
3. **Monitor Processing**: 
   - View real-time progress on Dashboard or Jobs page
   - WebSocket updates show live progress
4. **Search Documents**:
   - Use Search page for full-text search
   - Apply filters for better results
   - Click results to view full document
5. **View Documents**:
   - Browse all documents
   - View individual pages
   - Reprocess low-quality pages

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `GET /api/documents/:id/pages` - Get document pages
- `POST /api/documents/:id/reprocess` - Reprocess pages
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Search
- `GET /api/search?q=query` - Search documents
- `GET /api/search/document/:id?q=query` - Search within document
- `POST /api/search/advanced` - Advanced search
- `GET /api/search/suggestions?q=query` - Get search suggestions

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs/:id/cancel` - Cancel job

## Real-time Updates

The application uses Socket.IO for real-time updates:
- Job progress updates
- Document status changes
- Processing notifications

## File Structure

```
OptiSearch/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── middleware/      # Auth & validation
│   ├── uploads/         # File storage
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── App.jsx      # Main app
│   │   └── main.jsx     # Entry point
│   └── index.html
└── README.md
```

## Notes

**PDF Rendering:**
The current implementation uses a placeholder for PDF-to-image conversion. For production use, integrate `pdf-poppler` or `pdf2pic` for actual PDF rendering:

```bash
npm install pdf-poppler
```

**OCR Accuracy:**
- Higher quality images yield better results
- Use preprocessing options for scanned documents
- Confidence scores indicate extraction quality
- Reprocess low-confidence pages with different settings

**Performance:**
- Max 3 concurrent OCR jobs (configurable)
- Large PDFs are processed page-by-page
- All processing is asynchronous

## Future Enhancements

- [ ] Advanced image preprocessing
- [ ] Multiple OCR engine support
- [ ] Batch operations
- [ ] Export search results
- [ ] Document sharing
- [ ] Analytics dashboard
- [ ] Mobile app

