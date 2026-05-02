"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, Database, Search, Loader2, ChevronRight, Cpu, Network, FileSearch } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  references?: any[];
  timestamp: Date;
  thinking?: boolean;
}

const EXAMPLE_QUERIES = [
  "Analyze political instability risks in Sub-Saharan Africa",
  "Which regions show highest flood risk correlation with economic instability?",
  "Detect anomalies in casualties and criminal activity trends",
  "Summarize cyber threat landscape in Southeast Asia",
  "What is the projected health risk escalation in conflict zones?",
];

const PIPELINE_STEPS = [
  { icon: Search, label: "Embedding Query", detail: "Converting natural language → BERT semantic vector" },
  { icon: Database, label: "RAG Vector Search", detail: "Querying Supabase pgvector across incident history" },
  { icon: Cpu, label: "ML Inference", detail: "Scoring relevance against PyTorch risk model" },
  { icon: Network, label: "Synthesis", detail: "Composing intel from matched context windows" },
];

export default function AgentsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "agent",
      content: "Intel Agent online. I have access to the full CrisisLens incident database and can perform semantic vector search across 20+ risk dimensions. Ask me to analyze any region, identify correlations, or synthesize threat landscapes.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const runQuery = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    // Animate through pipeline steps
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, 700));
    }
    setActiveStep(null);

    try {
      const res = await fetch("/api/intel-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: data.insight || data.error || "No response generated.",
        references: data.references || [],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "Intel Agent is currently unable to reach the vector database. Ensure Supabase is connected and the pgvector extension is enabled.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        const el = document.getElementById(`msg-${userMsg.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <Bot className="w-6 h-6 text-indigo-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">CrisisLens Intel Agent</h1>
            <p className="text-xs text-slate-400">Agentic RAG · BERT Embeddings · pgvector Search · PyTorch Inference</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Agent Online
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Pipeline Visualizer */}
        <div className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Orchestration Pipeline</h2>
            <div className="space-y-2">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === idx;
                const isDone = activeStep !== null && idx < activeStep;
                return (
                  <motion.div
                    key={idx}
                    animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                    className={`p-3 rounded-lg border transition-all ${
                      isActive ? "bg-indigo-600/20 border-indigo-500/40" :
                      isDone ? "bg-emerald-500/10 border-emerald-500/20" :
                      "bg-slate-800/50 border-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isDone ? "text-emerald-400" : "text-slate-500"}`} />
                      )}
                      <span className={`text-xs font-semibold ${isActive ? "text-indigo-300" : isDone ? "text-emerald-300" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {isActive && (
                      <p className="text-[10px] text-slate-400 mt-1 pl-6">{step.detail}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Queries</h2>
            <div className="space-y-2">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => runQuery(q)}
                  disabled={isProcessing}
                  className="w-full text-left text-xs p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600 transition-all flex items-start gap-2 disabled:opacity-40"
                >
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-indigo-500" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  id={`msg-${msg.id}`}
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    msg.role === "agent" ? "bg-indigo-600/30 border border-indigo-500/30" : "bg-slate-700 border border-slate-600"
                  }`}>
                    {msg.role === "agent" ? <Bot className="w-4 h-4 text-indigo-400" /> : <span className="text-xs font-bold text-slate-300">U</span>}
                  </div>
                  <div className={`max-w-2xl rounded-xl p-4 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 border border-slate-700 text-slate-200"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none text-slate-200 prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-a:text-indigo-400 focus:outline-none break-words overflow-x-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {msg.references && msg.references.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <FileSearch className="w-3 h-3" /> Retrieved Context ({msg.references.length} records)
                        </p>
                        {msg.references.map((ref: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-400 bg-slate-700/50 rounded p-2 mb-1">
                            {ref.title || ref.description || JSON.stringify(ref).slice(0, 100)}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] mt-2 opacity-40">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-sm text-slate-400">Orchestrating pipeline...</span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} className="h-px" />
          </div>

          {/* Input Box */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus-within:border-indigo-500/50 transition-all">
              <input
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                placeholder="Ask the Intel Agent to analyze a region or risk pattern..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && runQuery(input)}
                disabled={isProcessing}
              />
              <button
                onClick={() => runQuery(input)}
                disabled={isProcessing || !input.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-2">
              Queries are vectorized via BERT embeddings → searched against Supabase pgvector → synthesized by the ML inference agent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
