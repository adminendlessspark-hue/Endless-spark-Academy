import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getDirectDownloadUrl } from '../utils';
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path for react-pdf using Vite's URL resolution
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface SecurePdfViewerProps {
  url: string;
  title?: string;
  userName?: string;
  userId?: string;
  isFullscreen?: boolean;
  externalPageNumber?: number;
  onPageChange?: (page: number) => void;
  isSecure?: boolean;
}

export default function SecurePdfViewer({ 
  url, 
  title, 
  userName, 
  userId, 
  isFullscreen = false,
  externalPageNumber,
  onPageChange,
  isSecure = true
}: SecurePdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const [pdfData, setPdfData] = useState<Blob | string | ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const abortControllers: AbortController[] = [];

    const fetchPdf = async () => {
      setIsLoading(true);
      setLoadError(null);
      setPdfData(null);
      
      const directUrl = getDirectDownloadUrl(url);
      
      let urlsToTry: string[] = [];
      let success = false;
      const uploadIndex = directUrl.indexOf('/uploads/');
      
      if (uploadIndex !== -1) {
        // This is a local upload! Strip domain to keep it relative, 100% same-origin & ultra-fast
        const relativeUrl = directUrl.substring(uploadIndex);
        urlsToTry = [relativeUrl, directUrl];
      } else if (directUrl.startsWith('/') || directUrl.startsWith('uploads/')) {
        const relativeUrl = directUrl.startsWith('/') ? directUrl : `/${directUrl}`;
        urlsToTry = [relativeUrl, directUrl];
      } else {
        // External URLs (e.g. Google Drive, CDN links, Firebase Storage, GCS)
        const proxies = [
          (u: string) => `/api/proxy-pdf?url=${encodeURIComponent(u)}`,
          (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
          (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
          (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          (u: string) => u // Original URL
        ];

        // Always prioritize our custom high-speed backend proxy first, then try original direct URL, then other public proxies
        const orderedProxies = [
          proxies[0],       // Custom server-side proxy (fast & bypassed CORS)
          (u: string) => u, // Direct fetch (might be CORS enabled)
          proxies[1],       // corsproxy.io
          proxies[2],       // codetabs
          proxies[3]        // allorigins
        ];

        urlsToTry = orderedProxies.map(p => p(directUrl));
      }

      for (let i = 0; i < urlsToTry.length; i++) {
        if (!isMounted) return;
        
        const abortController = new AbortController();
        abortControllers.push(abortController);
        
        try {
          const fetchUrl = urlsToTry[i];
          console.log(`Attempting to fetch PDF from: ${fetchUrl}`);
          
          // 8 second timeout per attempt to prevent hanging
          const timeoutId = setTimeout(() => abortController.abort(), 8000);
          
          const response = await fetch(fetchUrl, { signal: abortController.signal });
          clearTimeout(timeoutId);

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const blob = await response.blob();
          
          // Basic validation to ensure we didn't get an HTML error page from the proxy
          if (blob.type.includes('text/html') || blob.size < 1000) {
             throw new Error('Invalid PDF data received');
          }

          // Validate PDF signature
          const text = await blob.slice(0, 1024).text();
          if (!text.includes('%PDF-')) {
            throw new Error('Invalid PDF signature');
          }

          const arrayBuffer = await blob.arrayBuffer();

          if (isMounted) {
            setPdfData(arrayBuffer);
            setIsLoading(false);
            success = true;
            break;
          }
        } catch (err) {
          console.warn(`Fetch attempt ${i} failed:`, err);
        }
      }

      if (!success && isMounted) {
        setLoadError('Failed to load document. Please check the URL or ensure CORS is enabled.');
        setIsLoading(false);
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      abortControllers.forEach(controller => controller.abort());
    };
  }, [url]);

  React.useEffect(() => {
    if (externalPageNumber !== undefined && externalPageNumber !== pageNumber) {
      setPageNumber(externalPageNumber);
    }
  }, [externalPageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(externalPageNumber || 1);
  }

  const goToPrevPage = () => {
    const next = Math.max(pageNumber - 1, 1);
    setPageNumber(next);
    if (onPageChange) onPageChange(next);
  };
  const goToNextPage = () => {
    const next = Math.min(pageNumber + 1, numPages || 1);
    setPageNumber(next);
    if (onPageChange) onPageChange(next);
  };
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div 
      className={`flex flex-col items-center bg-gray-100 rounded-xl overflow-hidden border border-gray-200 w-full ${isSecure ? 'select-none' : ''} ${isFullscreen ? 'h-full flex-1' : ''}`} 
      style={isSecure ? { 
        WebkitTouchCallout: 'none', 
        WebkitUserSelect: 'none', 
        userSelect: 'none',
        KhtmlUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      } : {}}
      onContextMenu={(e) => {
        if (isSecure) {
          e.preventDefault();
          return false;
        }
      }}
    >
      {/* Toolbar */}
      <div className="w-full bg-gray-800 text-white p-3 flex items-center justify-between">
        <div className="font-medium truncate max-w-[200px] md:max-w-md">{title || 'Document Viewer'}</div>
        <div className="flex items-center gap-4">
          {!isSecure && (
            <a 
              href={getDirectDownloadUrl(url)} 
              download 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white shrink-0 flex items-center gap-1.5" 
              title="Download Document"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Download</span>
            </a>
          )}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button onClick={zoomOut} className="p-1 hover:bg-gray-600 rounded"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1 hover:bg-gray-600 rounded"><ZoomIn className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="p-1 hover:bg-gray-600 rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs w-16 text-center">Page {pageNumber} of {numPages || '--'}</span>
            <button onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)} className="p-1 hover:bg-gray-600 rounded disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* PDF Container */}
      <div className={`w-full overflow-auto flex justify-center p-4 bg-gray-200 relative ${isFullscreen ? 'flex-1 h-full min-h-0' : 'min-h-[500px] max-h-[800px]'}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading document...</div>
        ) : loadError ? (
          <div className="flex items-center justify-center h-64 text-red-500 text-center px-4">{loadError}</div>
        ) : pdfData ? (
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error while rendering document!', error)}
            loading={<div className="flex items-center justify-center h-64 text-gray-500">Rendering document...</div>}
            error={<div className="flex items-center justify-center h-64 text-red-500 text-center px-4">Failed to render document.</div>}
          >
            <div className={`relative inline-block ${isSecure ? 'pointer-events-none' : ''}`}>
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={!isSecure} 
                renderAnnotationLayer={!isSecure}
                className="shadow-xl"
              />
              {/* Transparent overlay to prevent long-press/save image on mobile */}
              {isSecure && (
                <div 
                  className="absolute inset-0 z-10 bg-transparent pointer-events-auto" 
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onTouchStart={(e) => {
                    // Prevent default touch behaviors that might lead to download options
                    if (e.touches.length > 1) return; // Allow multi-touch for zooming if implemented later
                  }}
                />
              )}
              
              {/* Watermark Overlay */}
              {isSecure && (userName || userId) && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-wrap justify-center items-center opacity-10 select-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="transform -rotate-45 p-8 text-xl font-bold text-gray-900 whitespace-nowrap">
                      {userName} {userName && userId ? '-' : ''} {userId}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Document>
        ) : null}
      </div>
    </div>
  );
}
