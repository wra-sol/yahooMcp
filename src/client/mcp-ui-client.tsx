import React, { useState, useEffect } from 'react';
import { UIResourceRenderer } from '@mcp-ui/client';

interface MCPUIResource {
  uri: string;
  content: {
    type: 'rawHtml';
    htmlString: string;
  };
  encoding: string;
  [key: string]: any;
}

// MCP-wrapped resource format (from tool calls)
interface MCPWrappedResource {
  type: 'resource';
  resource: {
    uri: string;
    content?: {
      type: 'rawHtml';
      htmlString: string;
    };
    encoding?: string;
    mimeType?: string;
    text?: string;
    [key: string]: any;
  };
}

// Helper function to unwrap MCP resources to UI resource format
function unwrapMCPResource(resource: any): MCPUIResource | null {
  // Check URI scheme first (MCP-UI best practice)
  if (resource.resource?.uri?.startsWith('ui://')) {
    const unwrapped = resource.resource;
    
    // Handle mimeType/text format (convert to rawHtml)
    if (unwrapped.mimeType === 'text/html' && unwrapped.text) {
      return {
        uri: unwrapped.uri,
        content: {
          type: 'rawHtml' as const,
          htmlString: unwrapped.text
        },
        encoding: 'text'
      };
    }
    
    // Handle mimeType/uri-list format (convert to rawHtml with iframe)
    if (unwrapped.mimeType === 'text/uri-list' && unwrapped.text) {
      return {
        uri: unwrapped.uri,
        content: {
          type: 'rawHtml' as const,
          htmlString: `<iframe src="${unwrapped.text}" style="width: 100%; height: 100%; border: none;"></iframe>`
        },
        encoding: 'text'
      };
    }
    
    // Handle Remote DOM content
    if (unwrapped.mimeType?.startsWith('application/vnd.mcp-ui.remote-dom') && unwrapped.text) {
      return {
        uri: unwrapped.uri,
        content: {
          type: 'rawHtml' as const,
          htmlString: `<div id="remote-dom-container"></div><script>${unwrapped.text}</script>`
        },
        encoding: 'text'
      };
    }
  }
  
  // Legacy: If it's already a UI resource, return as-is
  if (resource.content && resource.content.type === 'rawHtml') {
    return resource;
  }
  
  // Legacy: If it's an MCP-wrapped resource, unwrap it
  if (resource.type === 'resource' && resource.resource) {
    const unwrapped = resource.resource;
    
    // Handle different content formats
    if (unwrapped.content && unwrapped.content.type === 'rawHtml') {
      return unwrapped as MCPUIResource;
    }
    
    // Handle mimeType/text format (convert to rawHtml)
    if (unwrapped.mimeType === 'text/html' && unwrapped.text) {
      return {
        uri: unwrapped.uri,
        content: {
          type: 'rawHtml' as const,
          htmlString: unwrapped.text
        },
        encoding: unwrapped.encoding || 'text'
      };
    }
  }
  
  return null;
}

interface MCPUIClientProps {
  resources: MCPUIResource[];
  onToolCall?: (toolName: string, parameters: any) => Promise<any>;
  apiBaseUrl?: string;
}

export const MCPUIClient: React.FC<MCPUIClientProps> = ({ 
  resources, 
  onToolCall,
  apiBaseUrl = window.location.origin 
}) => {
  // Unwrap any MCP-wrapped resources
  const unwrappedResources = resources.map(resource => {
    const unwrapped = unwrapMCPResource(resource);
    return unwrapped || resource; // fallback to original if unwrap fails
  });

  const [selectedResource, setSelectedResource] = useState<MCPUIResource | null>(
    unwrappedResources.length > 0 ? unwrappedResources[0] : null
  );

  // Set up postMessage listener for iframe communication
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'tool' && event.data.payload) {
        const { toolName, params } = event.data.payload;
        const messageId = event.data.messageId;
        
        // Send acknowledgment back if messageId is present
        if (messageId) {
          event.source?.postMessage({
            type: 'ui-message-received',
            messageId: messageId,
          }, { targetOrigin: event.origin });
        }
        
        try {
          let result;
          if (onToolCall) {
            // Use custom tool call handler
            result = await onToolCall(toolName, params);
          } else {
            // Default: make HTTP request to server
            const response = await fetch(`${apiBaseUrl}/mcp-ui/action`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: toolName,
                parameters: params
              })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            result = await response.json();
          }

          // Send result back to iframe using new message format
          if (messageId) {
            event.source?.postMessage({
              type: 'ui-message-response',
              messageId: messageId,
              payload: {
                response: result
              }
            }, { targetOrigin: event.origin });
          } else {
            // Fallback to old format for backward compatibility
            event.source?.postMessage({
              type: 'toolResult',
              requestId: event.data.requestId,
              result: result
            }, { targetOrigin: event.origin });
          }
          
        } catch (error) {
          // Send error back to iframe using new message format
          if (messageId) {
            event.source?.postMessage({
              type: 'ui-message-response',
              messageId: messageId,
              payload: {
                error: error instanceof Error ? error.message : String(error)
              }
            }, { targetOrigin: event.origin });
          } else {
            // Fallback to old format for backward compatibility
            event.source?.postMessage({
              type: 'toolError',
              requestId: event.data.requestId,
              error: error instanceof Error ? error.message : String(error)
            }, { targetOrigin: event.origin });
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onToolCall, apiBaseUrl]);

  if (!selectedResource) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No UI resources available</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Resource selector */}
      {unwrappedResources.length > 1 && (
        <div style={{ 
          padding: '10px', 
          borderBottom: '1px solid #ddd', 
          backgroundColor: '#f8f9fa' 
        }}>
          <select 
            value={selectedResource?.uri || ''}
            onChange={(e) => {
              const resource = unwrappedResources.find(r => r.uri === e.target.value);
              setSelectedResource(resource || null);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {unwrappedResources.map(resource => (
              <option key={resource.uri} value={resource.uri}>
                {getResourceDisplayName(resource.uri)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resource renderer */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <UIResourceRenderer 
          resource={selectedResource}
        />
      </div>
    </div>
  );
};

// Helper function to get display name from URI
function getResourceDisplayName(uri: string): string {
  const parts = uri.split('/').pop()?.split('-') || [];
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
}

export default MCPUIClient;

