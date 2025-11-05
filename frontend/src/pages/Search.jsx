import React, { useState } from 'react';
import { Search as SearchIcon, Filter, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState({
    fileType: '',
    minConfidence: 0
  });

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    setSearched(true);

    try {
      const params = { q: query };
      if (filters.fileType) params.fileType = filters.fileType;
      if (filters.minConfidence > 0) params.minConfidence = filters.minConfidence;

      const response = await searchAPI.search(params);
      setResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ background: '#fef3c7', padding: '0 0.25rem' }}>{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'center' }}>
          Search Documents
        </h1>
        <p style={{ color: 'var(--gray)', textAlign: 'center', marginBottom: '2rem' }}>
          Search across all your documents using full-text search
        </p>

        <form onSubmit={handleSearch} className="card mb-4">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Search for documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={searching}>
              {searching ? <div className="spinner" style={{ width: '1rem', height: '1rem' }} /> : <SearchIcon size={18} />}
              Search
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <label className="label" style={{ fontSize: '0.75rem' }}>File Type</label>
              <select className="input" value={filters.fileType} onChange={(e) => setFilters(f => ({ ...f, fileType: e.target.value }))}>
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" style={{ fontSize: '0.75rem' }}>Min Confidence</label>
              <select className="input" value={filters.minConfidence} onChange={(e) => setFilters(f => ({ ...f, minConfidence: parseInt(e.target.value) }))}>
                <option value={0}>Any</option>
                <option value={50}>50%+</option>
                <option value={70}>70%+</option>
                <option value={90}>90%+</option>
              </select>
            </div>
          </div>
        </form>

        {searching && <LoadingSpinner fullScreen={false} />}

        {searched && !searching && (
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1rem' }}>
              Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
            </p>

            {results.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FileText size={48} color="var(--gray)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--gray)' }}>No results found</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map(result => (
                  <div key={result.document._id} className="card">
                    <Link to={`/documents/${result.document._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                        <FileText size={24} color="var(--primary)" />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                            {result.document.title}
                          </h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.75rem' }}>
                            {result.matchCount} {result.matchCount === 1 ? 'page' : 'pages'} • 
                            Confidence: {result.document.averageConfidence.toFixed(0)}%
                          </p>
                          {result.matchingPages.slice(0, 2).map(page => (
                            <div key={page.pageNumber} style={{
                              background: 'var(--bg)',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              marginBottom: '0.5rem',
                              fontSize: '0.875rem'
                            }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray)', marginBottom: '0.25rem' }}>
                                Page {page.pageNumber}
                              </p>
                              <p style={{ lineHeight: '1.5' }}>
                                {highlightText(page.snippet, query)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
