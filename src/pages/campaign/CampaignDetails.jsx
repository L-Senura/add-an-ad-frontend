import React, { useState, useEffect } from 'react';
import {
  Layers,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  PlusCircle,
  Loader2,
  Check,
} from 'lucide-react';
import {
  getPricingCatalog,
  calculatePrice,
  createCampaign,
  DEFAULT_RATE_CARD,
  DEFAULT_CAMPAIGN_TYPES,
} from './campaignApi';
import { getStoredAuthSession } from '../client/api';
import logoImg from '../../assets/Add-an-Ad.png';

export default function CampaignDetails({ onBackToHome, onCampaignCreated }) {
  const [clientSession] = useState(() => getStoredAuthSession());
  const [campaignTypes, setCampaignTypes] = useState(DEFAULT_CAMPAIGN_TYPES);
  const [rateCard, setRateCard] = useState(DEFAULT_RATE_CARD);

  const [formData, setFormData] = useState({
    campaignName: '',
    campaignType: 'In-Site Ad Hype',
    selectedChannels: ['on-site pin', 'YouTube'],
    status: 'ACTIVE',
  });

  const [priceBreakdown, setPriceBreakdown] = useState({
    itemizedPrices: { 'on-site pin': 1000, 'YouTube': 1000 },
    totalCampaignPrice: 2000,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Load pricing catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const catalog = await getPricingCatalog();
        if (catalog.campaignTypes && catalog.campaignTypes.length > 0) {
          setCampaignTypes(catalog.campaignTypes);
        }
        if (catalog.channelRates) {
          setRateCard(catalog.channelRates);
        }
      } catch (e) {
        console.warn('Could not load remote catalog:', e);
      }
    }
    loadCatalog();
  }, []);

  // Recalculate price whenever selected channels change
  useEffect(() => {
    async function updatePrice() {
      if (formData.selectedChannels.length === 0) {
        setPriceBreakdown({ itemizedPrices: {}, totalCampaignPrice: 0 });
        return;
      }
      setIsCalculating(true);
      try {
        const breakdown = await calculatePrice(formData.selectedChannels);
        setPriceBreakdown(breakdown);
      } catch (err) {
        console.error('Pricing error:', err);
      } finally {
        setIsCalculating(false);
      }
    }
    updatePrice();
  }, [formData.selectedChannels]);

  const toggleChannel = (channelName) => {
    setFormData((prev) => {
      const exists = prev.selectedChannels.includes(channelName);
      const updated = exists
        ? prev.selectedChannels.filter((c) => c !== channelName)
        : [...prev.selectedChannels, channelName];
      return { ...prev, selectedChannels: updated };
    });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessData(null);

    if (!formData.campaignName.trim()) {
      setErrorMessage('Campaign name is required.');
      return;
    }
    if (!formData.campaignType) {
      setErrorMessage('Campaign type must be selected.');
      return;
    }
    if (formData.selectedChannels.length === 0) {
      setErrorMessage('Please select at least one advertising platform.');
      return;
    }

    // Resolve client ID from session or fallback
    const resolvedClientId = clientSession?.userId || 1;

    const payload = {
      clientID: resolvedClientId,
      campaignName: formData.campaignName.trim(),
      campaignType: formData.campaignType,
      selectedChannels: formData.selectedChannels.join(', '),
      campaignPrices: priceBreakdown.totalCampaignPrice,
      status: formData.status || 'ACTIVE',
    };

    setIsLoading(true);
    try {
      const result = await createCampaign(payload);
      setSuccessData(result);
      if (onCampaignCreated) {
        onCampaignCreated(result);
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Failed to create campaign. Please verify backend connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(8, 217, 214, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 85% 85%, rgba(255, 46, 99, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.03) 0%, transparent 60%)
        `,
      }}
    >
      {/* Top Header / Navigation */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:shadow-sm text-[#252A34] hover:border-[#08D9D6]"
        >
          <ArrowLeft className="w-4 h-4 text-[#252A34]" />
          Back to Dashboard
        </button>

        <div className="flex items-center space-x-3">
          <img
            src={logoImg}
            alt="Add-an-Ad Logo"
            className="h-9 w-auto object-contain select-none"
          />
          <span className="text-lg font-bold text-[#252A34]">
            Add-an-Ad
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40"
          >
            Campaign Studio
          </span>
        </div>
      </header>

      {/* Main Campaign Builder Container */}
      <main className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#252A34]">
            Level Up Your Company
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-600">
            Customize your target channels, preview real-time platform rates, and launch your campaign.
          </p>
        </div>

        {/* Rounded Card */}
        <div
          className="rounded-[32px] p-6 sm:p-10 shadow-xl border border-gray-200 bg-white relative transition-all duration-300"
        >
          {/* Subtle palette accent line */}
          <div
            className="absolute top-0 left-10 right-10 h-1.5 rounded-b-full"
            style={{
              background:
                'linear-gradient(90deg, #08D9D6 0%, #252A34 50%, #FF2E63 100%)',
            }}
          />

          {/* Success screen if campaign added */}
          {successData ? (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm bg-[#08D9D6]/20"
              >
                <CheckCircle2 className="w-9 h-9 text-[#08D9D6]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#252A34]">
                Ad Campaign Launched!
              </h2>
              <p className="text-sm mb-6 text-gray-600">
                Your advertisement{' '}
                <span className="font-bold text-[#252A34]">
                  "{successData.campaignName || formData.campaignName}"
                </span>{' '}
                has been registered successfully.
              </p>

              <div
                className="p-5 rounded-2xl text-left border border-gray-200 mb-6 space-y-2.5 text-xs sm:text-sm bg-[#EAEAEA]/50 text-[#252A34]"
              >
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500">Campaign ID:</span>
                  <span className="font-bold">#{successData.campaignId || 'NEW'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500">Campaign Category:</span>
                  <span className="font-bold">{formData.campaignType}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="text-gray-500">Allocated Platforms:</span>
                  <span className="font-bold">{formData.selectedChannels.join(', ')}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Total Campaign Investment:</span>
                  <span
                    className="text-base font-extrabold px-3 py-1 rounded-xl bg-[#08D9D6] text-[#252A34]"
                  >
                    Rs. {priceBreakdown.totalCampaignPrice?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  Return to Agency Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    setFormData({
                      campaignName: '',
                      campaignType: 'In-Site Ad Hype',
                      selectedChannels: ['on-site pin', 'YouTube'],
                      status: 'ACTIVE',
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Post Another Campaign
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {errorMessage && (
                <div
                  className="p-3.5 rounded-2xl flex items-start gap-3 border text-xs sm:text-sm animate-shake bg-[#FF2E63]/10 border-[#FF2E63] text-[#FF2E63]"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FF2E63]" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* 1. Campaign Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#252A34]">
                  Campaign Type (Menu Selection) <span className="text-[#FF2E63]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Layers className="w-4 h-4 text-gray-400" />
                  </span>
                  <select
                    name="campaignType"
                    value={formData.campaignType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, campaignType: e.target.value }))
                    }
                    className="w-full pl-10 pr-8 py-3 rounded-xl border border-gray-300 text-sm font-semibold transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm cursor-pointer text-[#252A34]"
                  >
                    {campaignTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Campaign Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#252A34]">
                  Campaign Name <span className="text-[#FF2E63]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    name="campaignName"
                    value={formData.campaignName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, campaignName: e.target.value }))
                    }
                    placeholder="e.g. Q3 Summer Brand Blitz"
                    required
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-300 text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm text-[#252A34]"
                  />
                </div>
              </div>

              {/* 3. Select Platforms to make campaign */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#252A34]">
                    Select Platforms to make campaign <span className="text-[#FF2E63]">*</span>
                  </label>
                  <span className="text-xs font-medium text-gray-500">
                    Click to select multiple channels
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(rateCard).map(([platform, price]) => {
                    const isSelected = formData.selectedChannels.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => toggleChannel(platform)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-[#08D9D6] border-[#08D9D6] bg-[#08D9D6]/5 shadow-xs'
                            : 'hover:border-gray-300 bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs transition-colors ${
                              isSelected
                                ? 'bg-[#08D9D6] border-[#08D9D6] text-[#252A34]'
                                : 'border-gray-300 bg-white text-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span
                            className="text-xs sm:text-sm font-semibold capitalize text-[#252A34]"
                          >
                            {platform}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            isSelected
                              ? 'bg-[#08D9D6]/20 text-[#252A34]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Rs. {price.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Total Price for selected campaigns */}
              <div
                className="p-4 rounded-2xl border border-gray-200 bg-[#EAEAEA]/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#252A34]">
                    Total Price for selected campaigns
                  </span>
                  {isCalculating && (
                    <span className="text-xs flex items-center gap-1 text-[#08D9D6] font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Calculating...
                    </span>
                  )}
                </div>

                {/* Selected breakdown pills */}
                {formData.selectedChannels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {formData.selectedChannels.map((ch) => (
                      <span
                        key={ch}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 shadow-xs text-[#252A34]"
                      >
                        <span className="capitalize">{ch}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#FF2E63] font-bold">
                          Rs. {(rateCard[ch] || 500).toLocaleString()}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic mb-2">
                    No platforms selected yet.
                  </p>
                )}

                <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">Calculated Total:</span>
                  <div className="text-right">
                    <span
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FF2E63]"
                    >
                      Rs. {priceBreakdown.totalCampaignPrice?.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 block">LKR (All taxes included)</span>
                  </div>
                </div>
              </div>

              {/* 5. Current Campaign Status */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#252A34]">
                    Current Campaign Status
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Will be activated immediately upon creation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#08D9D6]"
                    />
                    <span
                      className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#08D9D6]"
                    />
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/40"
                  >
                    {formData.status}
                  </span>
                </div>
              </div>

              {/* 6. Wireframe Action Button: Add Your Ad Campaign */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl text-[#252A34] font-extrabold text-base sm:text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                    boxShadow: '0 10px 25px -5px rgba(8, 217, 214, 0.4)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Campaign...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      <span>Add Your Ad Campaign</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Add-an-Ad Platform • Campaign Allocation & Multi-Channel Rates</p>
      </footer>
    </div>
  );
}
