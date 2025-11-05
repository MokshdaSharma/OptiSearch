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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', textAlign: 'center' }}>
          Search Documents
        </h1>
        <p style={{ color: 'var(--gray)', textAlign: 'center', marginBottom: '3rem', fontSize: '1rem' }}>
          Search across all your documents using full-text search
        </p>

        <form onSubmit={handleSearch} className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Search for documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, fontSize: '1rem', padding: '0.875rem 1rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={searching} style={{ fontSize: '1rem', padding: '0.875rem 1.5rem' }}>
              {searching ? <div className="spinner" style={{ width: '1rem', height: '1rem' }} /> : <SearchIcon size={20} />}
              Search
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
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
            <p style={{ fontSize: '1rem', color: 'var(--gray)', marginBottom: '1.5rem', fontWeight: '500' }}>
              Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
            </p>

            {results.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 3rem' }}>
                <FileText size={64} color="var(--gray)" style={{ margin: '0 auto 1.5rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No results found</h3>
                <p style={{ color: 'var(--gray)' }}>Try adjusting your search query or filters</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {results.map(result => (
                  <div key={result.document._id} className="card" style={{ padding: '2rem', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <Link to={`/documents/${result.document._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '1.25rem' }}>
                        <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1rem', borderRadius: '0.75rem' }}>
                          <FileText size={28} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                            {result.document.title}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1rem' }}>
                            {result.matchCount} {result.matchCount === 1 ? 'page match' : 'page matches'} • 
                            Confidence: {result.document.averageConfidence.toFixed(0)}%
                          </p>
                          {result.matchingPages.slice(0, 2).map(page => (
                            <div key={page.pageNumber} style={{
                              background: 'var(--bg)',
                              padding: '1rem',
                              borderRadius: '0.75rem',
                              marginBottom: '0.75rem',
                              fontSize: '0.875rem',
                              border: '1px solid var(--border)'
                            }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                Page {page.pageNumber}
                              </p>
                              <p style={{ lineHeight: '1.6' }}>
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
