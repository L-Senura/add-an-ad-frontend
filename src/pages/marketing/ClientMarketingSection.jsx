import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Eye,
  MousePointerClick,
  Calendar,
  Activity,
  Sparkles,
  Loader2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { getAnalysisByClientId } from './marketingApi';

export default function ClientMarketingSection({ clientId = 1, companyName = 'Your Agency' }) {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await getAnalysisByClientId(clientId);
      setAnalyses(data || []);
    } catch (err) {
      console.warn('Error loading client marketing analyses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getAnalysisByClientId(clientId);
        if (isMounted) {
          setAnalyses(data || []);
        }
      } catch (err) {
        console.warn('Error loading client marketing analyses:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [clientId]);

  // Aggregate metrics for client
  const totalViews = analyses.reduce((acc, a) => acc + (a.campaignViews || 0), 0);
  const totalClicks = analyses.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

  // Parse progress percentage
  const parseProgressPercent = (progressStr) => {
    if (!progressStr) return 50;
    const match = String(progressStr).match(/(\d+)%/);
    if (match) return Math.min(100, Math.max(0, parseInt(match[1], 10)));
    if (progressStr.toLowerCase().includes('concluded') || progressStr.toLowerCase().includes('completed')) return 100;
    if (progressStr.toLowerCase().includes('scheduled')) return 20;
    return 60;
  };

  return (
    <div
      className="rounded-[32px] p-6 sm:p-8 bg-white border shadow-md transition-all"
      style={{ borderColor: 'rgba(8, 217, 214, 0.25)' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-gray-100 gap-3">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-[#252A34]">
            <TrendingUp className="w-5 h-5 text-[#FF2E63]" />
            Marketing Analytics & Audience Reach
          </h3>
          <p className="text-xs text-gray-500">
            Real-time campaign progress, audience views tracking, and optimization remarks for {companyName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-400 mr-1">Views:</span>
              <span className="font-extrabold text-[#252A34]">{totalViews.toLocaleString()}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#FF2E63]/10 border border-[#FF2E63]/25">
              <span className="text-gray-500 mr-1">CTR:</span>
              <span className="font-extrabold text-[#FF2E63]">
                {avgCtr}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchClientAnalyses}
            disabled={isLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Refresh Marketing Insights"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#08D9D6]" />
          <p className="text-xs font-semibold text-gray-400">Loading campaign progress & audience data...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
          <Layers className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <h4 className="text-sm font-bold text-gray-700">No Marketing Analysis Recorded Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Once agency analysts initiate performance tracking for your live campaigns, audience views and progress will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyses.map((item) => {
            const percent = parseProgressPercent(item.campaignProgress);
            const isConcluded =
              String(item.campaignProgress).toLowerCase().includes('concluded') ||
              String(item.campaignProgress).toLowerCase().includes('completed');

            return (
              <div
                key={item.analysisId}
                className="p-5 rounded-2xl border bg-gray-50/70 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
              >
                <div>
                  {/* Campaign Title & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#252A34] leading-snug">
                        {item.campaignName}
                      </h4>
                      {item.campaignId && (
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Campaign #{item.campaignId}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap ${
                        isConcluded
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40'
                      }`}
                    >
                      {isConcluded ? 'Concluded' : 'Active'}
                    </span>
                  </div>

                  {/* Visible Date Interval */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-[#08D9D6]" />
                    <span>Visible:</span>
                    <span className="font-bold text-[#252A34]">
                      {item.visibleStartDate || 'N/A'} → {item.visibleEndDate || 'N/A'}
                    </span>
                  </div>

                  {/* Views & Clicks Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                      <div className="text-[9px] text-gray-400 font-bold uppercase flex items-center justify-center gap-0.5">
                        <Eye className="w-2.5 h-2.5 text-[#08D9D6]" /> Views
                      </div>
                      <div className="text-sm font-black text-[#252A34] mt-0.5">
                        {(item.campaignViews || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                      <div className="text-[9px] text-gray-400 font-bold uppercase flex items-center justify-center gap-0.5">
                        <MousePointerClick className="w-2.5 h-2.5 text-[#FF2E63]" /> Clicks
                      </div>
                      <div className="text-sm font-black text-[#FF2E63] mt-0.5">
                        {(item.clicks || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                      <div className="text-[9px] text-gray-400 font-bold uppercase flex items-center justify-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5 text-[#08D9D6]" /> CTR
                      </div>
                      <div className="text-sm font-black text-[#08D9D6] mt-0.5">
                        {item.campaignViews > 0
                          ? (((item.clicks || 0) / item.campaignViews) * 100).toFixed(2)
                          : '0.00'}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#08D9D6]" /> Progress:
                      </span>
                      <span className="font-extrabold text-[11px] text-[#252A34]">
                        {item.campaignProgress || `${percent}%`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          background: isConcluded
                            ? '#252A34'
                            : 'linear-gradient(90deg, #08D9D6 0%, #FF2E63 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  {item.remarks && (
                    <div
                      className="p-2.5 rounded-xl border text-xs"
                      style={{
                        backgroundColor: '#FFF5F7',
                        borderColor: 'rgba(255, 46, 99, 0.25)',
                        color: '#252A34',
                      }}
                    >
                      <span className="font-bold block text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1 text-[#FF2E63]">
                        <Sparkles className="w-2.5 h-2.5" /> Analyst Optimization Note:
                      </span>
                      <p className="text-[11px] italic text-[#252A34] leading-snug">"{item.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
