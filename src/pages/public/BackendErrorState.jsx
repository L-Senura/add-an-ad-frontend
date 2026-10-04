import React, { useState } from 'react';
import {
  ServerOff,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

export default function BackendErrorState({
  onRetry,
  onUseOfflineDemo,
  endpoint = '/api/client or /api/admin/clients',
  errorDetails = 'Connection refused at http://localhost:8080. The Spring Boot backend server is not running or unreachable.',
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryClick = async () => {
    setIsRetrying(true);
    try {
      if (onRetry) await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl border-2 border-rose-200 shadow-2xl p-6 sm:p-10 space-y-6 text-[#252A34] animate-modal-content">
        
        {/* Header with Server Off Icon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div className="p-4 rounded-2xl bg-rose-50 text-[#FF2E63] border border-rose-100 shrink-0">
            <ServerOff className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF2E63]" />
              Backend Connection Offline
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#252A34] tracking-tight">
              Backend Server Not Connected
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Unable to reach the Spring Boot backend REST APIs to fetch real company details and reviews.
            </p>
          </div>
        </div>

        {/* Diagnostics & Technical Details Card */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 sm:p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-gray-500 text-[11px]">
              Connection Diagnostics
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
              HTTP 503 / Network Error
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-gray-700 bg-white p-3 rounded-xl border border-gray-200 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Target Host:</span>
              <span className="font-bold text-[#252A34]">http://localhost:8080</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Target API:</span>
              <span className="font-bold text-[#FF2E63]">{endpoint}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status Info:</span>
              <span className="text-rose-600 font-semibold truncate">{errorDetails}</span>
            </div>
          </div>

          {/* Quick Steps to Connect */}
          <div className="pt-2 space-y-2">
            <span className="font-bold text-[#252A34] block">How to connect with backend:</span>
            <ul className="space-y-1.5 text-gray-600 pl-1">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#08D9D6] text-[#252A34] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Launch your Spring Boot application (e.g. run <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">AddAnAdApplication.java</code> or <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">mvn spring-boot:run</code> on port <strong>8080</strong>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#08D9D6] text-[#252A34] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Ensure MySQL or your configured database server is running and tables are initialized.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#08D9D6] text-[#252A34] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Click the <strong>"Retry Connection"</strong> button below to instantly load real live company records.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {onUseOfflineDemo ? (
            <button
              type="button"
              onClick={onUseOfflineDemo}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 hover:border-[#08D9D6] hover:bg-[#EAF6FB] text-gray-700 hover:text-[#252A34] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#08D9D6]" />
              <span>Explore In Offline Demo Mode</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleRetryClick}
            disabled={isRetrying}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#08D9D6] hover:bg-[#06b5b2] text-[#252A34] font-extrabold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking Connection...' : 'Retry Backend Connection'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
