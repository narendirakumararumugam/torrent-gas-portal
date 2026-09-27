import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react';
import { buildSupportReply, supportChatQuickPrompts } from '../../data/supportAssistant';

const initialMessages = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'I’m your AI support assistant. Ask me about your bill, tariff, complaint, or connection status.',
  },
  {
    id: 'assistant-tip',
    role: 'assistant',
    text: 'Try one of the suggested questions below to get started quickly.',
  },
];

function SupportChatAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const submitMessage = (message) => {
    const trimmed = message.trim();
    if (!trimmed || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setIsTyping(true);

    timerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: buildSupportReply(trimmed),
        },
      ]);
      setIsTyping(false);
    }, 550);
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? 'Close support assistant' : 'Open support assistant'}
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_18px_45px_rgba(16,185,129,0.35)] transition duration-200 hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <div
        className={`fixed bottom-24 right-5 z-50 flex overflow-hidden border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out sm:h-[500px] sm:w-[380px] sm:rounded-3xl ${
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100 scale-100'
            : 'pointer-events-none translate-y-6 opacity-0 scale-[0.98]'
        } inset-x-0 top-0 h-[100dvh] w-full rounded-none sm:inset-auto sm:bottom-24 sm:right-5 sm:left-auto`}
      >
        <div className="flex h-full w-full flex-col bg-slate-50">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-4 text-slate-100 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
                <Bot className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">AI Support Assistant</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-500/20">
                    Online
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-300">Ask about bills, tariff rates, complaints, contracts, or connection status.</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Minimize support assistant"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {supportChatQuickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitMessage(prompt)}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-left text-xs font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div
              ref={scrollRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-inner"
            >
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Assistant is typing...
                  </div>
                </div>
              )}
            </div>

            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(draft);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about billing, tariff, complaint, contract, or connection status..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default SupportChatAssistant;
