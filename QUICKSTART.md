# OptiSearch - Quick Start Guide

## 🚀 Your Application is Ready!

Both the backend and frontend are currently running:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

## 📋 First Steps

### 1. Open the Application
Visit http://localhost:5173 in your browser

### 2. Create an Account
- Click "Sign Up"
- Enter username, email, and password
- You'll be automatically logged in

### 3. Upload Your First Document
- Navigate to "Upload" page
- Drag & drop a PDF or image file
- Select OCR language (default: English)
- Optionally enable preprocessing options:
  - **Deskew**: Auto-rotate skewed images
  - **Denoise**: Reduce image noise
  - **Binarize**: Convert to black & white for better OCR
  - **Rotate**: Manual rotation (0°, 90°, 180°, 270°)
- Click "Upload"

### 4. Monitor Processing
- Go to "Jobs" page to see real-time processing
- Or stay on "Dashboard" for overview
- Progress updates via WebSocket (live updates!)

### 5. Search Your Documents
- Once processing completes, use "Search" page
- Enter keywords to find across all documents
- Results show matching pages with highlighted snippets
- Click results to view full document

## 🎯 Key Features Demonstrated

### Upload Features
- **Drag & Drop**: Modern file upload interface
- **Multi-file**: Upload multiple files at once
- **Validation**: Automatic file type and size checking
- **Duplicate Detection**: Hash-based duplicate prevention

### OCR Processing
- **Async Jobs**: Non-blocking processing
- **Multi-language**: 12 language support
- **Preprocessing**: Image enhancement options
- **Confidence Scoring**: Quality metrics per page

### Search Capabilities
- **Full-text Search**: MongoDB text indexing
- **Filters**: File type, confidence level, date range
- **Highlighting**: Search terms highlighted in results
- **Relevance Ranking**: Best matches first

### Real-time Updates
- **WebSocket**: Live progress updates
- **Toast Notifications**: Success/error messages
- **Progress Bars**: Visual feedback

### Quality Control
- **Low Confidence Detection**: Automatic flagging
- **Re-processing**: Retry with different settings
- **Page-by-Page View**: Detailed inspection

## 📝 Testing Workflow

1. **Upload Test Documents**:
   - PDF with text (best results)
   - Clear image with text
   - Scanned document (try preprocessing)

2. **Monitor Processing**:
   - Watch real-time progress
   - Check confidence scores
   - Identify low-quality pages

3. **Search & Retrieve**:
   - Search for specific terms
   - Use filters to narrow results
   - View page-by-page details

4. **Quality Management**:
   - Find low-confidence pages
   - Reprocess with different languages/options
   - Compare before/after results

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm run dev    # Start with nodemon (auto-restart)
npm start      # Production start
```

### Frontend
```bash
cd frontend
npm run dev    # Start Vite dev server
npm run build  # Build for production
```

## 📊 Project Statistics

- **Backend Routes**: 20+ API endpoints
- **Frontend Pages**: 7 main pages
- **Components**: 10+ React components
- **Database Models**: 4 Mongoose schemas
- **Real-time Events**: WebSocket integration
- **Languages Supported**: 12 OCR languages

## 🎨 UI Highlights

- **Modern Design**: Professional, clean interface
- **Responsive**: Works on all screen sizes
- **Animations**: Smooth transitions and loading states
- **Accessibility**: Semantic HTML and ARIA labels
- **Color Scheme**: Purple gradient theme with light mode

## 🔧 Configuration

All settings are in `backend/.env`:
- MongoDB connection (already configured)
- JWT secret
- Max file size (50MB default)
- Concurrent jobs (3 default)
- Allowed file types

## 📖 API Documentation

All endpoints are documented in README.md

Key endpoints:
- `POST /api/auth/register` - Create account
- `POST /api/documents/upload` - Upload file
- `GET /api/search?q=query` - Search documents
- `GET /api/jobs` - View processing jobs

## 🎯 Next Steps

1. **Upload Sample Documents**: Test with your own PDFs/images
2. **Try Different Languages**: Test multi-language support
3. **Experiment with Preprocessing**: See quality improvements
4. **Test Search**: Find specific content in your documents
5. **Monitor Jobs**: Watch real-time processing

## 💡 Tips

- **Better OCR Results**:
  - Use high-resolution images
  - Enable preprocessing for scanned docs
  - Choose correct language
  - Reprocess low-confidence pages

- **Search Tips**:
  - Use specific keywords
  - Apply filters for better results
  - Check multiple pages in results

- **Performance**:
  - Large PDFs process page-by-page
  - Multiple uploads are queued
  - 3 jobs can run simultaneously

## 🐛 Troubleshooting

**Backend not starting?**
- Check MongoDB connection in .env
- Ensure port 5000 is available
- Run `npm install` again

**Frontend not loading?**
- Ensure backend is running first
- Check port 5173 is available
- Clear browser cache

**Upload failing?**
- Check file size (max 50MB)
- Verify file type (PDF, JPG, PNG, TIFF)
- Check backend logs

## 🎉 Enjoy Your OCR Search System!

Your fully-functional document search system is ready to use. 

For questions or issues, check the logs or README.md for detailed documentation.

**Happy Searching! 🔍**
