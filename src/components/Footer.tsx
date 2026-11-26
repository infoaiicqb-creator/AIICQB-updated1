import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ShieldCheck, CheckCircle2, Globe2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#10264B] text-white pt-14 pb-8 border-t-4 border-[#F47716]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-700/60">
          {/* Column 1: Brand & About */}
          <div className="lg:col-span-2 space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl max-w-fit shadow-md mx-auto md:mx-0">
              <img src="/aicqb-logo.png" alt="AIICQB Logo" className="h-14 sm:h-16 w-auto object-contain" />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
              AI International Certification & Qualification Board (AIICQB) is an independent professional body setting
              benchmarks for global skill standards, verified assessments, and multi-industry qualifications.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1.5 w-full flex flex-col items-center md:items-start">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <MapPin className="w-4 h-4 text-[#F47716] flex-shrink-0" />
                <span>Kharadi, Pune, Maharashtra – 411014, India</span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                <Mail className="w-4 h-4 text-[#F47716] flex-shrink-0" />
                <a href="mailto:support@aiicqb.org" className="hover:text-white transition-colors">
                  support@aiicqb.org
                </a>
                <span>|</span>
                <a href="mailto:contact@aiicqb.org" className="hover:text-white transition-colors">
                  contact@aiicqb.org
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Certifications */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-b-2 md:border-b-0 md:border-l-2 pb-1 md:pb-0 md:pl-2 border-[#F47716] inline-block">
              Certification Domains
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 w-full text-center md:text-left">
              <li>
                <Link to="/certifications?domain=AI+%26+Machine+Learning" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  AI & Machine Learning
                </Link>
              </li>
              <li>
                <Link to="/certifications?domain=Software+Testing" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Software Testing & QA
                </Link>
              </li>
              <li>
                <Link to="/certifications?domain=Data+Science" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Data Science & Analytics
                </Link>
              </li>
              <li>
                <Link to="/certifications?domain=Cybersecurity" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Cybersecurity Defense
                </Link>
              </li>
              <li>
                <Link to="/certifications?domain=Cloud+Computing" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Cloud & DevOps
                </Link>
              </li>
              <li>
                <Link to="/certifications?domain=Business+Analysis" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Business Analysis & PM
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Verify */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-b-2 md:border-b-0 md:border-l-2 pb-1 md:pb-0 md:pl-2 border-[#F47716] inline-block">
              Platform & Verify
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 w-full text-center md:text-left">
              <li>
                <Link to="/verify" onClick={scrollToTop} className="text-[#F47716] font-semibold hover:underline flex items-center justify-center md:justify-start">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link to="/exams" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Online Examinations
                </Link>
              </li>
              <li>
                <Link to="/learning" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Learning Hub (LMS)
                </Link>
              </li>
              <li>
                <Link to="/pricing" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link to="/resources" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Study Guides & Syllabi
                </Link>
              </li>
              <li>
                <Link to="/events" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Events & Webinars
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Organization */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-b-2 md:border-b-0 md:border-l-2 pb-1 md:pb-0 md:pl-2 border-[#F47716] inline-block">
              Organization
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 w-full text-center md:text-left">
              <li>
                <Link to="/about" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  About AICQB
                </Link>
              </li>
              <li>
                <Link to="/partners" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Training Partners
                </Link>
              </li>
              <li>
                <Link to="/careers" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Careers at AICQB
                </Link>
              </li>
              <li>
                <Link to="/blog" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Blog & Industry Insights
                </Link>
              </li>
              <li>
                <Link to="/support" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Help Center & Support
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={scrollToTop} className="hover:text-[#F47716] transition-colors">
                  Contact Advisory Team
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright and Links */}
        <div className="pt-6 pb-4 text-xs text-slate-400 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between text-xs text-center md:text-left">
            <p className="text-center md:text-left">© {new Date().getFullYear()} AIICQB – AI International Certification & Qualification Board. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-4 mt-3 md:mt-0 text-slate-400">
              <Link to="/terms" onClick={scrollToTop} className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/privacy" onClick={scrollToTop} className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/code-of-ethics" onClick={scrollToTop} className="hover:text-white transition-colors">
                Examination Code of Ethics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

