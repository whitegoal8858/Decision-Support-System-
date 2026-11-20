import React, { useState } from 'react';
import { 
  Bot, Send, Sparkles, AlertCircle, FileText, CheckCircle2, 
  HelpCircle, RefreshCw, Copy, Check, Info, ShieldCheck, Database
} from 'lucide-react';
import { api } from '../api/client';
import { ChatResponse } from '../types';

interface AIAssistantPageProps {
  initialPrompt?: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ initialPrompt = '' }) => {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    responseObj?: ChatResponse;
    timestamp: string;
  }>>([
    {
      role: 'assistant',
      content: "Namaste. I am the Department of Tourism & Culture Decision Support AI Assistant. I provide evidence-grounded answers based strictly on safe parameterized database queries and verified DPR/inspection documents. How may I assist your review today?",
      timestamp: 'Just now'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>(initialPrompt);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const sampleQuestions = [
    "Which tourism projects are delayed in Uttar Pradesh?",
    "Show projects with physical progress below 50%.",
    "Compare financial utilisation and physical progress.",
    "Which milestones are overdue?",
    "Which projects have budget overruns?",
    "Give me a district-wise project report.",
    "What are the major risks requiring attention?",
    "Summarise the latest inspection report."
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user' as const,
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.askAssistant(textToSend);
      const assistantMsg = {
        role: 'assistant' as const,
        content: res.answer,
        responseObj: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "An error occurred while querying the decision support layer. Please verify backend service connectivity.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-gov-navy" />
            Executive Decision Support AI Assistant
            <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Grounded Queries Only
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official question-answering system combining parameterized SQL analytics with RAG document verification
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Database className="w-3.5 h-3.5 text-gov-navy" />
          <span>Safe Parameterized Query Service</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Recommended Administrative Inquiries:
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-xl border shadow-xs ${
                isUser
                  ? 'bg-blue-50/60 border-blue-200 ml-2 sm:ml-12'
                  : 'bg-white border-slate-200 mr-2 sm:mr-8'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser ? 'bg-blue-600 text-white' : 'bg-gov-navy text-white'
                  }`}>
                    {isUser ? 'U' : 'AI'}
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {isUser ? 'Authorised Official' : 'UP Tourism Decision Support Assistant'}
                  </span>
                  {msg.responseObj && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {msg.responseObj.is_demo_mode ? 'Deterministic Grounded Engine' : 'Live LLM Model'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="prose prose-slate max-w-none text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Evidence Citations & Missing Data Warnings */}
              {msg.responseObj && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {/* Citations */}
                  {msg.responseObj.evidence_citations && msg.responseObj.evidence_citations.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <FileText className="w-3.5 h-3.5 text-gov-navy" />
                        Retrieved Document Citations ({msg.responseObj.evidence_citations.length}):
                      </div>
                      <div className="space-y-2">
                        {msg.responseObj.evidence_citations.map((cite, cIdx) => (
                          <div key={cIdx} className="text-[11px] bg-white p-2.5 rounded border border-slate-200/80">
                            <div className="font-semibold text-slate-900">
                              {cite.source_title} ({cite.document_type}) • {cite.page_or_row || 'Main Section'}
                            </div>
                            <div className="text-slate-600 italic mt-0.5">"{cite.excerpt}"</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Facts Verified */}
                  {msg.responseObj.facts && msg.responseObj.facts.length > 0 && (
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800">Verified Database Groundings:</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        {msg.responseObj.facts.map((fact, fIdx) => (
                          <li key={fIdx}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Data Warnings */}
                  {msg.responseObj.missing_data_warnings && msg.responseObj.missing_data_warnings.length > 0 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        {msg.responseObj.missing_data_warnings.map((w, wIdx) => (
                          <div key={wIdx}>{w}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="p-5 rounded-xl border border-slate-200 bg-white mr-8 flex items-center space-x-3 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 text-gov-navy animate-spin" />
            <span>Analyzing inquiry, executing safe query layer, and grounding answer...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="sticky bottom-4 bg-white p-3 rounded-xl border border-slate-200 shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask questions about delays, budgets, overdue milestones, or inspection summaries..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={loading}
            className="flex-1 text-xs px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-navy bg-white disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="px-4 py-2.5 bg-gov-navy text-white rounded-lg hover:bg-gov-navyLight disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send Inquiry
          </button>
        </form>
      </div>
    </div>
  );
};
