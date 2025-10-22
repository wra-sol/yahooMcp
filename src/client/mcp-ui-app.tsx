import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import MCPUIClient from './mcp-ui-client';

interface MCPUIAppProps {
  initialResources?: any[];
}

const MCPUIApp: React.FC<MCPUIAppProps> = ({ initialResources = [] }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resources from server - load everything before rendering
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If we have initial resources, use them
        if (initialResources.length > 0) {
          setResources(initialResources);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch from server
        const response = await fetch('/mcp-ui/resources');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch resources: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.resources || !Array.isArray(data.resources)) {
          throw new Error('Invalid resources data received');
        }
        
        // Pre-load all resource data
        const enrichedResources = await Promise.all(
          data.resources.map(async (resource: any) => {
            try {
              // Ensure the resource has all required fields
              return {
                ...resource,
                content: resource.content || { type: 'rawHtml', htmlString: '<div>Loading...</div>' },
                encoding: resource.encoding || 'text'
              };
            } catch (err) {
              console.warn('Failed to enrich resource:', resource.uri, err);
              return resource;
            }
          })
        );
        
        setResources(enrichedResources);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [initialResources]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', fontSize: '14px' }}>Loading Yahoo Fantasy UI...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24',
          maxWidth: '400px'
        }}>
          <h3 style={{ marginTop: 0 }}>Error Loading UI</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <h3>No UI Resources Available</h3>
          <p>Make sure your MCP server is running and providing UI resources.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <MCPUIClient resources={resources} />
    </div>
  );
};

// Initialize the app
export const initializeMCPUIApp = (container: HTMLElement, initialResources?: any[]) => {
  // Use pre-loaded data if available, otherwise use props
  const preloadedData = (window as any).__MCP_UI_DATA__;
  const resources = preloadedData?.preloaded ? preloadedData.resources : (initialResources || (window as any).__INITIAL_RESOURCES__ || []);
  
  const root = createRoot(container);
  root.render(<MCPUIApp initialResources={resources} />);
  return root;
};

export default MCPUIApp;

