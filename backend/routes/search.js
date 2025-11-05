const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Document = require('../models/Document');
const Page = require('../models/Page');

/**
 * Search across all user documents
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      q, // search query
      fileType,
      tags,
      minConfidence,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'relevance'
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build text search query
    const searchQuery = {
      $text: { $search: q }
    };

    // Find matching pages
    const pageQuery = { ...searchQuery };
    
    // Add filters
    if (minConfidence) {
      pageQuery.confidence = { $gte: parseFloat(minConfidence) };
    }

    const matchingPages = await Page.find(pageQuery)
      .select('document pageNumber text confidence')
      .limit(1000); // Limit to prevent performance issues

    // Get unique document IDs
    const documentIds = [...new Set(matchingPages.map(p => p.document.toString()))];

    // Build document query
    const docQuery = {
      _id: { $in: documentIds },
      uploadedBy: req.user._id
    };

    if (fileType) {
      docQuery.fileType = fileType;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      docQuery.tags = { $in: tagArray };
    }

    if (dateFrom || dateTo) {
      docQuery.createdAt = {};
      if (dateFrom) docQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) docQuery.createdAt.$lte = new Date(dateTo);
    }

    // Find matching documents
    let documents = await Document.find(docQuery);

    // Calculate relevance score and add matching pages info
    const results = documents.map(doc => {
      const docPages = matchingPages.filter(p => p.document.toString() === doc._id.toString());
      
      // Calculate relevance score
      const avgConfidence = docPages.reduce((sum, p) => sum + p.confidence, 0) / docPages.length;
      const matchCount = docPages.length;
      const relevanceScore = (avgConfidence / 100) * Math.log(matchCount + 1);

      return {
        document: doc,
        matchingPages: docPages.map(p => ({
          pageNumber: p.pageNumber,
          confidence: p.confidence,
          snippet: extractSnippet(p.text, q)
        })),
        relevanceScore,
        matchCount
      };
    });

    // Sort results
    if (sortBy === 'relevance') {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === 'date') {
      results.sort((a, b) => b.document.createdAt - a.document.createdAt);
    } else if (sortBy === 'confidence') {
      results.sort((a, b) => b.document.averageConfidence - a.document.averageConfidence);
    }

    // Paginate
    const paginatedResults = results.slice(skip, skip + parseInt(limit));

    res.json({
      results: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length,
        totalPages: Math.ceil(results.length / parseInt(limit))
      },
      query: q
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

/**
 * Search within specific document
 */
router.get('/document/:documentId', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Verify document ownership
    const document = await Document.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search pages
    const pages = await Page.find({
      document: req.params.documentId,
      $text: { $search: q }
    })
      .select('pageNumber text confidence words lines')
      .sort({ pageNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Page.countDocuments({
      document: req.params.documentId,
      $text: { $search: q }
    });

    // Add snippets and highlights
    const results = pages.map(page => {
      const highlights = findHighlights(page.text, q, page.words);
      return {
        pageNumber: page.pageNumber,
        confidence: page.confidence,
        snippet: extractSnippet(page.text, q),
        highlights
      };
    });

    res.json({
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      document: {
        id: document._id,
        title: document.title
      }
    });
  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

/**
 * Advanced search with multiple filters
 */
router.post('/advanced', auth, async (req, res) => {
  try {
    const {
      query,
      fileTypes,
      tags,
      minConfidence,
      maxConfidence,
      dateFrom,
      dateTo,
      languages,
      statuses,
      page = 1,
      limit = 10
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build page query
    const pageQuery = {
      $text: { $search: query }
    };

    if (minConfidence || maxConfidence) {
      pageQuery.confidence = {};
      if (minConfidence) pageQuery.confidence.$gte = parseFloat(minConfidence);
      if (maxConfidence) pageQuery.confidence.$lte = parseFloat(maxConfidence);
    }

    if (languages && languages.length > 0) {
      pageQuery.language = { $in: languages };
    }

    const matchingPages = await Page.find(pageQuery)
      .select('document pageNumber text confidence')
      .limit(1000);

    const documentIds = [...new Set(matchingPages.map(p => p.document.toString()))];

    // Build document query
    const docQuery = {
      _id: { $in: documentIds },
      uploadedBy: req.user._id
    };

    if (fileTypes && fileTypes.length > 0) {
      docQuery.fileType = { $in: fileTypes };
    }

    if (tags && tags.length > 0) {
      docQuery.tags = { $in: tags };
    }

    if (statuses && statuses.length > 0) {
      docQuery.status = { $in: statuses };
    }

    if (dateFrom || dateTo) {
      docQuery.createdAt = {};
      if (dateFrom) docQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) docQuery.createdAt.$lte = new Date(dateTo);
    }

    const documents = await Document.find(docQuery);

    // Build results with relevance scoring
    const results = documents.map(doc => {
      const docPages = matchingPages.filter(p => p.document.toString() === doc._id.toString());
      const avgConfidence = docPages.reduce((sum, p) => sum + p.confidence, 0) / docPages.length;
      const matchCount = docPages.length;
      const relevanceScore = (avgConfidence / 100) * Math.log(matchCount + 1);

      return {
        document: doc,
        matchingPages: docPages.map(p => ({
          pageNumber: p.pageNumber,
          confidence: p.confidence,
          snippet: extractSnippet(p.text, query)
        })),
        relevanceScore,
        matchCount
      };
    });

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const paginatedResults = results.slice(skip, skip + parseInt(limit));

    res.json({
      results: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length,
        totalPages: Math.ceil(results.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed', message: error.message });
  }
});

/**
 * Extract snippet around matching text
 */
function extractSnippet(text, query, contextLength = 150) {
  if (!text) return '';
  
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const lowerText = text.toLowerCase();
  
  let bestMatch = { index: -1, score: 0 };
  
  for (const term of queryTerms) {
    const index = lowerText.indexOf(term);
    if (index !== -1 && (index < bestMatch.index || bestMatch.index === -1)) {
      bestMatch = { index, score: term.length };
    }
  }
  
  if (bestMatch.index === -1) {
    return text.substring(0, contextLength * 2) + '...';
  }
  
  const start = Math.max(0, bestMatch.index - contextLength);
  const end = Math.min(text.length, bestMatch.index + contextLength);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

/**
 * Find highlight positions for matching words
 */
function findHighlights(text, query, words = []) {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const highlights = [];
  
  for (const word of words) {
    if (!word || !word.text) continue;
    const wordText = word.text.toLowerCase();
    for (const term of queryTerms) {
      if (wordText.includes(term)) {
        highlights.push({
          text: word.text,
          bbox: word.bbox,
          confidence: word.confidence
        });
        break;
      }
    }
  }
  
  return highlights;
}

/**
 * Get search suggestions
 */
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get unique tags
    const documents = await Document.find({ uploadedBy: req.user._id })
      .select('tags title')
      .limit(100);

    const allTags = new Set();
    const titleWords = new Set();

    documents.forEach(doc => {
      doc.tags.forEach(tag => allTags.add(tag));
      doc.title.split(/\s+/).forEach(word => {
        if (word.length > 2) titleWords.add(word.toLowerCase());
      });
    });

    const qLower = q.toLowerCase();
    const suggestions = [
      ...Array.from(allTags).filter(tag => tag.toLowerCase().includes(qLower)),
      ...Array.from(titleWords).filter(word => word.includes(qLower))
    ].slice(0, 10);

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

module.exports = router;
