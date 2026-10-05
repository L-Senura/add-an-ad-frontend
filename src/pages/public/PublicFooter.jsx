import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowUpRight,
  Heart,
  Megaphone,
} from 'lucide-react';
import { BACKEND_API_ROUTES } from '../../services/api';
import logoImg from '../../assets/Add-an-Ad.png';

export default function PublicFooter() {
  return (
    <footer id="agency-details" className="bg-[#161B26] text-gray-300 border-t border-[#252A34] pt-14 pb-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-white/10">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="p-2.5 rounded-lg bg-[#08D9D6]/10 text-[#08D9D6] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">100% Verified Agencies</h4>
              <p className="text-xs text-gray-400 mt-1">
                Every partner agency undergoes strict vetting, rate card auditing, and portfolio validation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="p-2.5 rounded-lg bg-[#FF2E63]/10 text-[#FF2E63] shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Transparent Public Reviews</h4>
              <p className="text-xs text-gray-400 mt-1">
                Authentic ratings from real brand clients and outside visitors. No fake or paid review manipulation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="p-2.5 rounded-lg bg-[#08D9D6]/10 text-[#08D9D6] shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Multi-Channel Ad Reach</h4>
              <p className="text-xs text-gray-400 mt-1">
                From high-performing YouTube and TikTok video promos to precision Google Search and outdoor media pins.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 py-12 border-b border-white/10">
          
          {/* Col 1: Platform Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <Link to="/" title="Add-an-Ad Homepage" className="inline-flex items-center group transition-transform hover:scale-105">
                <img
                  src={logoImg}
                  alt="Add-an-Ad Logo"
                  className="h-8 w-auto object-contain select-none"
                />
              </Link>
              <span className="text-lg font-black text-white tracking-tight">Add-an-Ad</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Add-an-Ad is the next-generation advertising agency marketplace and campaign coordination hub. Connecting visionary brands with high-performance creative partners worldwide.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#08D9D6]/10 text-[#08D9D6] border border-[#08D9D6]/20">
                <Sparkles className="w-3 h-3" />
                Next-Gen Ad Agency Platform
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Explore & Connect
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#companies" className="hover:text-[#08D9D6] transition-colors flex items-center gap-1">
                  <span>Find Your Best Suit Company</span>
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-[#08D9D6] transition-colors flex items-center gap-1">
                  <span>Frequently Asked Questions</span>
                </a>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.CLIENT_REGISTER} className="hover:text-[#08D9D6] transition-colors flex items-center gap-1">
                  <span>Register Brand Account</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.CAMPAIGN} className="hover:text-[#08D9D6] transition-colors flex items-center gap-1">
                  <span>Post Ad Campaign</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.CLIENT_CHAT} className="hover:text-[#08D9D6] transition-colors flex items-center gap-1">
                  <span>Live Agency Chat Desk</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals & Access */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Account Portals
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to={BACKEND_API_ROUTES.CLIENT_LOGIN} className="hover:text-[#08D9D6] transition-colors">
                  Client Brand Sign In
                </Link>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.CLIENT_REGISTER} className="hover:text-[#08D9D6] transition-colors">
                  New Client Registration
                </Link>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.ADMIN_LOGIN} className="hover:text-[#FF2E63] transition-colors">
                  Staff & Administrator Login
                </Link>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.ADMIN_APPROVALS} className="hover:text-[#FF2E63] transition-colors">
                  Agency Approvals & Moderation
                </Link>
              </li>
              <li>
                <Link to={BACKEND_API_ROUTES.FINANCE} className="hover:text-[#08D9D6] transition-colors">
                  Invoicing & Rate Cards
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Agency HQ Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Agency Headquarters
            </h3>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#08D9D6] shrink-0 mt-0.5" />
                <span>742 Evergreen Media Plaza, Level 8, Creative District, New York, NY 10012</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#08D9D6] shrink-0" />
                <span>+1 (800) 555-AD-NOW / (555) 849-2041</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#08D9D6] shrink-0" />
                <span>support@add-an-ad.agency</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#08D9D6] shrink-0" />
                <span>Monday – Friday: 8:00 AM – 6:00 PM EST</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Add-an-Ad Agency Network. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Review Guidelines</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Security Center</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
