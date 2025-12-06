"use client"

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { ChevronLeft, HelpCircle, Users, Calendar, Settings, Send } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/app" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </Link>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('helpCenterTitle') || 'Help Center'}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Intro */}
        <section className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{t('helpIntroTitle') || 'How can we help you?'}</h2>
          <p className="text-blue-100">{t('helpIntroDesc') || 'Here you find guides and answers to common questions.'}</p>
        </section>

        {/* Guides */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('helpGuidesTitle') || 'User Guides'}</h2>
          
          <div className="space-y-4">
            
            {/* Planner Guide */}
            <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <div className="flex items-center gap-3">
                    <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 p-2 rounded-lg">🚣</span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('helpCategoryPlanner')}</h3>
                 </div>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
                  
                  {/* Boat Manning */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpBoatManning')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>{t('helpBoatManning1')}</li>
                      <li>{t('helpBoatManning2')}</li>
                      <li>{t('helpBoatManningSwap')}</li>
                      <li>{t('helpBoatManning3')}</li>
                      <li>{t('helpBoatManning4')}</li>
                    </ul>
                  </div>

                  {/* Calculation */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpCalculation')}</h4>
                    <p className="mb-2">{t('helpCalculationDesc')}</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>{t('helpCalculation1')}</li>
                      <li>{t('helpCalculation2')}</li>
                      <li>{t('helpCalculation3')}</li>
                    </ul>
                  </div>

                  {/* Special Items */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpSpecialItems')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li><span className="font-bold">{t('canister')}:</span> {t('helpSpecialItems1')}</li>
                      <li><span className="font-bold">{t('guest')}:</span> {t('helpSpecialItems2')}</li>
                    </ul>
                  </div>

                  {/* Tools */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpToolsStats')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li><span className="font-bold">Magic KI:</span> {t('helpToolsStats1')}</li>
                      <li><span className="font-bold">Trimm:</span> {t('helpToolsStats2')}</li>
                      <li><span className="font-bold">Export:</span> {t('helpToolsStats3')}</li>
                    </ul>
                  </div>

                   {/* Boat Size */}
                   <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpBoatSize')}</h4>
                    <p>{t('helpBoatSizeDesc')}</p>
                  </div>

               </div>
            </details>

            {/* Team Admin Guide */}
            <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <div className="flex items-center gap-3">
                    <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg">⚙️</span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('helpCategoryTeam')}</h3>
                 </div>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
                  
                  {/* General Settings */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpTeamEditGeneral')}</h4>
                    <p className="mb-2">{t('helpTeamEditGeneralDesc')}</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>{t('helpTeamEditGeneral1')}</li>
                      <li>{t('helpTeamEditGeneral2')}</li>
                      <li>{t('helpTeamEditGeneral3')}</li>
                    </ul>
                  </div>

                  {/* Member Management */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpTeamEditMembers')}</h4>
                    <p className="mb-2">{t('helpTeamEditMembersDesc')}</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>{t('helpTeamEditMembers1')}</li>
                      <li>{t('helpTeamEditMembers2')}</li>
                      <li>{t('helpTeamEditMembers3')}</li>
                    </ul>
                  </div>
               </div>
            </details>

            {/* Dashboard Guide */}
            <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <div className="flex items-center gap-3">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-2 rounded-lg">📅</span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('helpManageEvents')}</h3>
                 </div>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
                   <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>{t('helpManageEvents1')}</li>
                      <li>{t('helpManageEvents2')}</li>
                      <li>{t('helpManageEvents3')}</li>
                   </ul>
                   <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('helpMembers')}</h4>
                      <ul className="list-disc list-inside space-y-1 ml-1">
                        <li>{t('helpMembers1')}</li>
                        <li>{t('helpMembers2')}</li>
                        <li>{t('helpMembers3')}</li>
                      </ul>
                   </div>
               </div>
            </details>

          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('helpFAQTitle') || 'Frequently Asked Questions'}</h2>
          
          <div className="space-y-4">
            
            {/* FAQ: Leaving Team */}
            <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <h3 className="font-bold text-slate-900 dark:text-white pr-4">{t('faqLeaveTeamTitle')}</h3>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                 <p>{t('faqLeaveTeamAnswer')}</p>
                 <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                   <li>{t('faqLeaveTeamStep1')}</li>
                   <li>{t('faqLeaveTeamStep2')}</li>
                 </ol>
               </div>
            </details>

            {/* FAQ: Missing Leave Button */}
            <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <h3 className="font-bold text-slate-900 dark:text-white pr-4">{t('faqNoLeaveButtonTitle')}</h3>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-800 dark:text-amber-200 mb-2">
                    <span className="font-bold">⚠️ {t('faqNoLeaveButtonWarning')}</span>
                  </div>
                  <p>{t('faqNoLeaveButtonAnswer')}</p>
               </div>
            </details>

             {/* FAQ: Create Team */}
             <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <h3 className="font-bold text-slate-900 dark:text-white pr-4">{t('faqCreateTeamTitle')}</h3>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p>{t('faqCreateTeamAnswer')}</p>
               </div>
             </details>

            {/* FAQ: Weight Change */}
            <details className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <h3 className="font-bold text-slate-900 dark:text-white pr-4">{t('faqWeightChangeTitle')}</h3>
                 <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
               </summary>
               <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p>{t('faqWeightChangeAnswer')}</p>
               </div>
            </details>

          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="scroll-mt-20">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('contactTitle')}</h2>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{t('contactTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{t('contactDesc')}</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
              const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
              const submitBtn = (form.querySelector('button[type="submit"]') as HTMLButtonElement);
              
              const statusDiv = document.getElementById('contact-status');
              if (statusDiv) {
                statusDiv.textContent = '';
                statusDiv.className = 'text-sm mt-2 hidden';
              }

              submitBtn.disabled = true;
              submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

              try {
                const res = await fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ category, message }),
                });

                if (res.ok) {
                  form.reset();
                  if (statusDiv) {
                    statusDiv.textContent = t('contactSent');
                    statusDiv.className = 'text-sm mt-4 text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg block animate-in fade-in';
                  }
                } else {
                  throw new Error('Failed');
                }
              } catch (err) {
                if (statusDiv) {
                    statusDiv.textContent = t('contactError');
                    statusDiv.className = 'text-sm mt-4 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg block animate-in fade-in';
                }
              } finally {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
              }
            }}>
              <div className="grid gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('contactCategoryLabel')}</label>
                  <select 
                    name="category" 
                    id="category"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                  >
                    <option value="Feature Request">{t('contactCategoryFeature')}</option>
                    <option value="Bug Report">{t('contactCategoryBug')}</option>
                    <option value="Question">{t('contactCategoryQuestion')}</option>
                    <option value="Other">{t('contactCategoryOther')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('contactMessageLabel')}</label>
                  <textarea  
                    name="message" 
                    id="message" 
                    rows={4}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow resize-none"
                    placeholder={t('contactMessagePlaceholder')}
                  ></textarea>
                </div>

                <div id="contact-status" className="hidden"></div>

                <button 
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {t('contactSend')}
                </button>
              </div>
            </form>
          </div>
        </section>

      </main>
    </div>
  )
}
