/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Search, Sparkles, Copy, Heart, Plus, Trash2, Edit2, X, Download, TrendingUp, Tag as TagIcon, Activity, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast, Toaster } from "sonner";
import PromptEditor from "@/components/PromptEditor";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/7BW5DWg8phKmxaxX6QAzec/sandbox/5zuPKqEtgMA6SaihHgN6z5-img-2_1772131374000_na1fn_aGVyby1hYnN0cmFjdC1tZXNo.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvN0JXNURXZzhwaEtteGF4WDZRQXplYy9zYW5kYm94LzV6dVBLcUV0Z01BNlNhaWhIZ042ejUtaW1nLTJfMTc3MjEzMTM3NDAwMF9uYTFmbl9hR1Z5YnkxaFluTjBjbUZqZEMxdFpYTm8ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=WSOl9uQ81PAAsNEIXEO1BJQ5CCIFvQBLXtbQJDZUzgA3xBhHE9J7ULgTSMGBd9S68qeYOto8EHCc2ro5Xmpv719gw3xbWCgllKmeenYOVtiPhCnk~5Pu2hzUM54SIghBi7cYEZuK90hL-6RoRE6pZ226AwPviKP5zPd09ru52uNUUN9JAefHcv3sQ8-qze9B4QPRWUtHCK3HPOI~aaCMA~nTA-h1uGa~zfQ0BJrp97vr81kV0NuFn5U9cHgOg~SND1Sz4~1EzEy87vx5ElUbrzu~eIwIi52EcaMmZ73uyZxmlLt5RR8LJt0ZmFz7VIa23wd3iCQCh06eQ2W2Kta-rA__";

export default function App() {
  const { user, isAuthenticated, login, logout, checkExpiration } = useAuth();
  
  useEffect(() => {
    checkExpiration();
  }, [checkExpiration]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTagIds, setActiveFilterTagIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<number | null>(null);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: number; name: string; color: string } | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);

  // Queries
  const { data: prompts = [], refetch: refetchPrompts } = trpc.prompts.list.useQuery();
  const { data: tags = [], refetch: refetchTags } = trpc.tags.list.useQuery();

  // Mutations
  const createPromptMutation = trpc.prompts.create.useMutation({
    onSuccess: () => {
      toast.success("Prompt criado com sucesso!");
      refetchPrompts();
      setIsPromptModalOpen(false);
      setNewPromptTitle("");
      setNewPromptContent("");
      setSelectedTagIds([]);
    },
    onError: (error: any) => {
      toast.error("Erro ao criar prompt: " + error.message);
    },
  });

  const deletePromptMutation = trpc.prompts.delete.useMutation({
    onSuccess: () => {
      toast.success("Prompt deletado!");
      refetchPrompts();
    },
  });

  const updatePromptMutation = trpc.prompts.update.useMutation({
    onSuccess: () => {
      toast.success("Prompt atualizado!");
      refetchPrompts();
    },
  });

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag criada!");
      refetchTags();
      setShowNewTagModal(false);
      setNewTagName("");
      setNewTagColor("#6366f1");
    },
  });

  const updateTagMutation = trpc.tags.update.useMutation({
    onSuccess: () => {
      toast.success("Tag atualizada!");
      refetchTags();
      setEditingTag(null);
    },
  });

  const deleteTagMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("Tag deletada!");
      refetchTags();
    },
  });

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      const promptTags = (p.tagIds || []).map((id: number) => tags.find(t => t.id === id));
      const matchesSearch = searchQuery === "" || 
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower) ||
        promptTags.some(tag => tag && tag.name.toLowerCase().includes(searchLower));

      if (currentView === 'dashboard') {
        if (!p.isFavorite) return false;
        const matchesTag = activeFilterTagIds.length === 0 || activeFilterTagIds.some(id => (p.tagIds || []).includes(id));
        return matchesSearch && matchesTag;
      }

      const matchesFavorite = !showFavoritesOnly || p.isFavorite === 1;
      const matchesTag = activeFilterTagIds.length === 0 || activeFilterTagIds.some(id => (p.tagIds || []).includes(id));
      return matchesSearch && matchesFavorite && matchesTag;
    });
  }, [prompts, searchQuery, showFavoritesOnly, activeFilterTagIds, currentView, tags]);

  // Chart Data
  const tagUsageData = useMemo(() => {
    return tags.map(tag => ({
      name: tag.name,
      count: prompts.filter(p => (p.tagIds || []).includes(tag.id)).length,
      color: tag.color || '#f59e0b'
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 5); // top 5 tags used
  }, [tags, prompts]);

  const favoritesActivityData = useMemo(() => {
    // Mocking activity trends over the last 6 days based on current favorites
    // Since we don't have "favorited_at" date in DB, we generate a mock trend that leads to current total favorites
    const totalFavs = prompts.filter(p => p.isFavorite).length;
    return [
      { name: 'Seg', favs: Math.max(0, totalFavs - 5) },
      { name: 'Ter', favs: Math.max(0, totalFavs - 4) },
      { name: 'Qua', favs: Math.max(0, totalFavs - 3) },
      { name: 'Qui', favs: Math.max(0, totalFavs - 2) },
      { name: 'Sex', favs: Math.max(0, totalFavs - 1) },
      { name: 'Hoje', favs: totalFavs }
    ];
  }, [prompts]);

  const handleSavePrompt = () => {
    if (!newPromptTitle.trim() || !newPromptContent.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }
    
    if (editingPromptId) {
      updatePromptMutation.mutate({
        promptId: editingPromptId,
        title: newPromptTitle,
        content: newPromptContent,
        tagIds: selectedTagIds,
      });
      setIsPromptModalOpen(false);
      setNewPromptTitle("");
      setNewPromptContent("");
      setSelectedTagIds([]);
    } else {
      createPromptMutation.mutate({
        title: newPromptTitle,
        content: newPromptContent,
        tagIds: selectedTagIds,
      });
    }
  };

  const handleOpenNewPrompt = () => {
    setEditingPromptId(null);
    setNewPromptTitle("");
    setNewPromptContent("");
    setSelectedTagIds([]);
    setIsPromptModalOpen(true);
  };

  const handleEditPrompt = (prompt: any) => {
    setEditingPromptId(prompt.id);
    setNewPromptTitle(prompt.title);
    setNewPromptContent(prompt.content);
    setSelectedTagIds(prompt.tagIds || []);
    setIsPromptModalOpen(true);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }
    createTagMutation.mutate({
      name: newTagName,
      color: newTagColor,
    });
  };

  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }
    updateTagMutation.mutate({
      tagId: editingTag.id,
      name: editingTag.name,
      color: editingTag.color,
    });
  };

  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Prompt copiado!");
  };

  const handleToggleFavorite = (promptId: number, isFavorite: number) => {
    updatePromptMutation.mutate({
      promptId,
      title: undefined,
      content: undefined,
      isFavorite: isFavorite ? 0 : 1,
    });
  };

  const handleExportJSON = () => {
    const dataToExport = filteredPrompts.map(p => ({
      title: p.title,
      content: p.content,
      tags: (p.tagIds || []).map((id: number) => tags.find(t => t.id === id)?.name).filter(Boolean),
      isFavorite: p.isFavorite === 1
    }));
    
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "prompts.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    
    toast.success("Prompts exportados em JSON!");
  };

  const handleExportCSV = () => {
    const headers = ['Título', 'Conteúdo', 'Tags', 'Favorito'];
    const csvRows = [headers.join(',')];
    
    filteredPrompts.forEach(p => {
      const pTags = (p.tagIds || [])
        .map((id: number) => tags.find(t => t.id === id)?.name)
        .filter(Boolean)
        .join('; ');
      
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      csvRows.push([
        escapeCsv(p.title),
        escapeCsv(p.content),
        escapeCsv(pTags),
        p.isFavorite ? 'Sim' : 'Não'
      ].join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "prompts.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    
    toast.success("Prompts exportados em CSV!");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === "larasaales" && loginPassword === "162385") {
      setLoginError("");
      login({ id: "1", name: "Lara Sales", username: loginUsername });
    } else {
      setLoginError("Usuário ou senha inválidos.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#111318] to-[#0b0c10] flex items-center justify-center p-4 dark">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full bg-[#1a1d24]/90 p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ceaf7a] to-[#a6824a] flex items-center justify-center text-slate-950 shadow-lg border border-[#e5ca9a]/30">
              <Sparkles size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Bem-vindo(a)</h1>
          <p className="text-slate-300 mb-8 font-light">Faça login para acessar sua biblioteca de prompts</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Usuário</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#ceaf7a]/50 transition-all backdrop-blur-md"
                placeholder="Ex: larasaales"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#ceaf7a]/50 transition-all backdrop-blur-md"
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm mt-2 font-medium bg-red-400/10 p-2 rounded-lg border border-red-400/20">{loginError}</p>
            )}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-to-r from-[#ceaf7a] to-[#a6824a] text-slate-950 font-semibold border-0 px-8 py-6 rounded-xl shadow-[0_0_20px_-5px_rgba(206,175,122,0.4)] hover:shadow-[0_0_30px_-5px_rgba(206,175,122,0.6)] hover:scale-[1.02] transition-all mt-6"
            >
              Fazer Login
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c10] text-[#a1a1aa] dark relative selection:bg-amber-500/30">
      {/* Ambient background for dark theme */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[#0b0c10] via-[#111318] to-[#0b0c10]">
      </div>

      <Toaster theme="dark" />
      {/* Hero Banner */}
      <header className="relative z-10 pt-8 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111318]/40 via-transparent to-transparent pointer-events-none" />
        <div className="relative container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#ceaf7a]" />
              <span className="text-[11px] font-semibold text-[#ceaf7a] uppercase tracking-[0.2em]">
                Biblioteca Pessoal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentView(currentView === 'home' ? 'dashboard' : 'home')}
                className="text-sm font-medium text-[#ceaf7a] hover:text-[#e5ca9a] hidden md:block transition-colors"
              >
                {currentView === 'home' ? 'Meu Dashboard' : 'Início'}
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ceaf7a] to-[#a6824a] text-[#111318] flex items-center justify-center font-bold shadow-lg hover:scale-105 transition-transform text-sm">
                    {user?.name?.[0] || 'U'}
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1d24]/95 backdrop-blur-xl border border-white/5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-slate-300 truncate mt-0.5">@{user?.username}</p>
                  </div>
                  <div className="p-1.5">
                    <button 
                      onClick={() => setCurrentView(currentView === 'home' ? 'dashboard' : 'home')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-[#ceaf7a] hover:bg-[#ceaf7a]/10 rounded-lg transition-colors flex items-center gap-2 md:hidden"
                    >
                      {currentView === 'home' ? 'Meu Dashboard' : 'Início'}
                    </button>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2 mt-1"
                    >
                      Sair da conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Hub de Prompts <span className="text-[#ceaf7a]">de IA</span>
            </h1>
            <p className="text-[15px] md:text-base text-slate-300 max-w-xl leading-relaxed font-light mb-8">
              Navegue, filtre e copie templates mestres otimizados para cada inteligência artificial.
            </p>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-sm font-medium text-slate-300">
                <div className="grid grid-cols-2 gap-[2px] w-3.5 h-3.5 opacity-70">
                  <div className="border border-current rounded-[2px]" />
                  <div className="border border-current rounded-[2px]" />
                  <div className="border border-current rounded-[2px]" />
                  <div className="border border-current rounded-[2px]" />
                </div>
                {tags.length} Categorias
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-sm font-medium text-slate-300">
                <Copy size={14} className="opacity-70" />
                {prompts.length} Prompts
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 container mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* Sidebar - Tags */}
        {currentView === 'home' && (
          <aside className="hidden md:flex flex-col w-64 pr-8 border-r border-white/[0.06]">
            <div className="flex items-center justify-between mb-4 mt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-3">
                CATEGORIAS
              </span>
              <button 
              onClick={() => setShowNewTagModal(true)}
              className="p-1 text-slate-400 hover:text-[#ceaf7a] transition-colors"
              title="Nova Categoria"
            >
              <Plus size={14} />
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto pb-8">
            <button
              onClick={() => setActiveFilterTagIds([])}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeFilterTagIds.length === 0
                  ? 'bg-white/5 text-white'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
            >
              {activeFilterTagIds.length === 0 && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-md bg-[#ceaf7a]" />
              )}
              <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs transition-all border ${activeFilterTagIds.length === 0 ? 'border-white/10 bg-white/5 text-white' : 'border-transparent bg-white/[0.04] text-slate-400'}`}>
                T
              </div>
              <span className="flex-1 text-left">Todos os Prompts</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeFilterTagIds.length === 0 ? 'text-[#ceaf7a]' : 'text-slate-400'}`}>{prompts.length}</span>
            </button>
            
            {tags.map((tag) => {
              const tagPromptsCount = prompts.filter(p => (p.tagIds || []).includes(tag.id)).length;
              const isSelected = activeFilterTagIds.includes(tag.id);
              
              return (
                <div key={tag.id} className="group relative">
                  <button
                    onClick={() => setActiveFilterTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-white/[0.04] text-white'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <div 
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-md"
                        style={{ backgroundColor: tag.color || '#ceaf7a', boxShadow: `0 0 10px ${tag.color || '#ceaf7a'}40` }}
                      />
                    )}
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold transition-all"
                      style={{ 
                        backgroundColor: isSelected ? `${tag.color || '#ceaf7a'}15` : 'rgba(255,255,255,0.02)',
                        color: isSelected ? (tag.color || '#ceaf7a') : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${isSelected ? `${tag.color || '#ceaf7a'}30` : 'transparent'}`
                      }}
                    >
                      {tag.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left flex flex-col items-start min-w-0">
                      <span className="font-medium truncate w-full">{tag.name}</span>
                      {tagPromptsCount > 0 && <span className="text-[10px] text-slate-400 mt-0.5">{tagPromptsCount} prompts</span>}
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 ${currentView === 'home' ? 'md:pl-8' : ''}`}>
          {currentView === 'home' && (
            <div className="mb-8">
              {activeFilterTagIds.length > 0 ? (
                <div className="mb-6">
                  <div className="flex flex-col gap-4 mb-2">
                     <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Filtrando por Tags ({activeFilterTagIds.length})
                     </h2>
                     <div className="flex flex-wrap gap-2">
                       {activeFilterTagIds.map(id => {
                         const tag = tags.find(t => t.id === id);
                         if (!tag) return null;
                         return (
                           <button
                             key={tag.id}
                             onClick={() => setActiveFilterTagIds(prev => prev.filter(tId => tId !== tag.id))}
                             className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm transition-all hover:opacity-80"
                             style={{ backgroundColor: `${tag.color || '#10b981'}20`, color: tag.color || '#10b981', border: `1px solid ${tag.color || '#10b981'}40` }}
                           >
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color || '#10b981' }} />
                             {tag.name}
                             <X size={14} className="ml-1 opacity-70 hover:opacity-100" />
                           </button>
                         );
                       })}
                     </div>
                  </div>
                  <p className="text-slate-300 text-sm mt-3">Prompts que contenham alguma das tags selecionadas.</p>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-3.5 h-3.5 rounded-full bg-slate-400" />
                     <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Todos os Prompts</h2>
                  </div>
                  <p className="text-slate-300 text-sm pl-[26px]">Navegue por toda sua biblioteca de templates.</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'dashboard' && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setCurrentView('home')}
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] hover:border-[#ceaf7a]/30 transition-all text-slate-300 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-white">Meu Dashboard Pessoal</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] rounded-3xl p-7 shadow-2xl hover:shadow-[0_8px_30px_rgba(206,175,122,0.15)] transition-all relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-slate-300 text-sm font-medium mb-2 relative">Total de Prompts</h4>
                  <p className="text-4xl font-bold text-white relative">{prompts.length}</p>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] rounded-3xl p-7 shadow-2xl hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] transition-all relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-slate-300 text-sm font-medium mb-2 relative">Favoritos</h4>
                  <p className="text-4xl font-bold text-red-400 drop-shadow-md relative">{prompts.filter((p: any) => p.isFavorite).length}</p>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] rounded-3xl p-7 shadow-2xl hover:shadow-[0_8px_30px_rgba(206,175,122,0.15)] transition-all relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-slate-300 text-sm font-medium mb-2 relative">Tags Criadas</h4>
                  <p className="text-4xl font-bold text-amber-500 drop-shadow-md relative">{tags.length}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* Tag Usage Chart */}
                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-3xl p-7 shadow-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <TagIcon size={18} className="text-amber-500" />
                    <h3 className="text-lg font-semibold text-white">Uso de Tags</h3>
                  </div>
                  {tagUsageData.length > 0 ? (
                    <div className="h-64 cursor-pointer">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tagUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip 
                            cursor={{ fill: '#ffffff0a' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {tagUsageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                      Nenhum dado de tag disponível.
                    </div>
                  )}
                </div>

                {/* Favorites Trend Chart */}
                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-3xl p-7 shadow-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Tendência de Favoritos</h3>
                  </div>
                  <div className="h-64 cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={favoritesActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="favs" name="Favoritos" stroke="#f87171" strokeWidth={3} dot={{ r: 4, fill: '#f87171', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Tag Management Section */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-6">
                  <TagIcon size={20} className="text-[#ceaf7a]" />
                  <h3 className="text-xl font-semibold text-white">Gerenciamento de Tags</h3>
                </div>
                {tags.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tags.map((tag) => (
                      <div key={tag.id} className="backdrop-blur-xl bg-[#111318]/50 border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between group hover:bg-white/[0.04] hover:border-white/[0.15] hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-3 w-full">
                            <div 
                              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner"
                              style={{ 
                                backgroundColor: `${tag.color || '#ceaf7a'}20`,
                                color: tag.color || '#ceaf7a',
                                border: `1px solid ${tag.color || '#ceaf7a'}40`
                              }}
                            >
                              {tag.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-white text-lg truncate" title={tag.name}>{tag.name}</h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Activity size={12} className="text-slate-500" />
                                <span className="text-xs text-slate-400 font-medium tracking-wide">
                                  {prompts.filter(p => (p.tagIds || []).includes(tag.id)).length} PROMPTS
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-white/[0.05] relative z-10">
                          <button
                            onClick={() => setEditingTag({ id: tag.id, name: tag.name, color: tag.color || "#6366f1" })}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.05]"
                            title="Editar tag"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteTagMutation.mutate(tag.id)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/[0.1] text-red-400 hover:text-white hover:bg-red-500 transition-colors border border-red-500/[0.2]"
                            title="Excluir tag"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm bg-white/[0.02] p-8 rounded-3xl border border-white/5 text-center">
                    Você ainda não criou nenhuma tag.
                  </div>
                )}
              </div>

              <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Heart size={20} className="text-red-500 fill-red-500" />
                Sua Coleção de Favoritos
              </h3>
            </div>
          )}

          {/* Search and Controls */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={currentView === 'dashboard' ? "Buscar nos favoritos..." : "Buscar prompts..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-all backdrop-blur-md shadow-sm"
                />
              </div>
              <div className="flex gap-2">
                {currentView !== 'dashboard' && (
                  <Button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    variant={showFavoritesOnly ? "default" : "outline"}
                    size="sm"
                    className={`gap-2 h-11 rounded-lg ${showFavoritesOnly ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-medium border-0 shadow-lg' : 'border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors'}`}
                  >
                    <Heart size={16} className={showFavoritesOnly ? 'fill-slate-950' : ''} />
                    <span className="hidden sm:inline">Favoritos</span>
                  </Button>
                )}
                <Button
                  onClick={() => setShowExportModal(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2 h-11 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button
                  onClick={handleOpenNewPrompt}
                  size="sm"
                  className="gap-2 h-11 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-medium border-0 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={16} />
                  Novo Prompt
                </Button>
              </div>
            </div>
          </div>

          {/* Prompts Grid */}
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredPrompts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-slate-400">Nenhum prompt encontrado</p>
                </motion.div>
              ) : (
                filteredPrompts.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    layoutId={`prompt-card-${prompt.id}`}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="backdrop-blur-xl bg-white/[0.02] rounded-3xl p-6 border border-white/[0.08] group hover:bg-white/[0.04] hover:border-[#ceaf7a]/40 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_-5px_rgba(206,175,122,0.2)] relative overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id);
                      if (expandedPromptId !== prompt.id) {
                        setTimeout(() => {
                          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ceaf7a]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4 relative">
                        <div className="flex-1 pr-32">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ceaf7a] transition-colors line-clamp-1" style={{ fontFamily: "'Playfair Display', serif" }}>{prompt.title}</h3>
                          <div className="flex gap-2 flex-wrap mt-2">
                          {(prompt.tagIds || []).map((tagId: number) => {
                            const tag = tags.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tag.id}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                                style={{ color: tag.color, backgroundColor: `${tag.color || '#6366f1'}15`, borderColor: `${tag.color || '#6366f1'}30` }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 bg-[#111318]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/[0.05] shadow-xl md:translate-y-1 md:group-hover:translate-y-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(prompt.id, prompt.isFavorite); }}
                          className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors"
                        >
                          <Heart
                            size={18}
                            className={prompt.isFavorite ? "fill-red-400 text-red-400" : "text-slate-300"}
                          />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyPrompt(prompt.content); }}
                          className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors"
                        >
                          <Copy size={18} className="text-slate-300 hover:text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditPrompt(prompt); }}
                          className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors"
                        >
                          <Edit2 size={18} className="text-slate-300 hover:text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePromptMutation.mutate(prompt.id); }}
                          className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors"
                        >
                          <Trash2 size={18} className="text-red-400 hover:text-red-300" />
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-300 text-sm line-clamp-3 bg-white/[0.04] p-4 rounded-xl border border-white/5">
                      {prompt.content}
                    </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* New Prompt Modal */}
      <AnimatePresence>
        {isPromptModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsPromptModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-3xl bg-slate-950/80 rounded-2xl p-6 w-full max-w-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">{editingPromptId ? "Editar Prompt" : "Novo Prompt"}</h2>
                <button onClick={() => setIsPromptModalOpen(false)} className="text-slate-300 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Título do prompt"
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/50"
                />

                <PromptEditor
                  content={newPromptContent}
                  onChange={setNewPromptContent}
                />

                <div className="space-y-2">
                  <label className="text-sm text-slate-300 mb-1 block">Tags:</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.length === 0 && <span className="text-sm text-slate-400">Nenhuma tag criada.</span>}
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          if (selectedTagIds.includes(tag.id)) {
                            setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id));
                          } else {
                            setSelectedTagIds([...selectedTagIds, tag.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                        style={selectedTagIds.includes(tag.id) ? { borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color || '#6366f1'}20` } : undefined}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSavePrompt}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-medium shadow-lg hover:shadow-xl transition-all border-0 py-6 rounded-xl"
                    disabled={createPromptMutation.isPending || updatePromptMutation.isPending}
                  >
                    Salvar Prompt
                  </Button>
                  <Button
                    onClick={() => setIsPromptModalOpen(false)}
                    variant="outline"
                    className="flex-1 py-6 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Tag Modal */}
      <AnimatePresence>
        {showNewTagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewTagModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-3xl bg-slate-950/80 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Nova Tag</h2>
                <button onClick={() => setShowNewTagModal(false)} className="text-slate-300 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />

                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-300">Cor:</label>
                  <input
                    type="color"
                    value={newTagColor || "#6366f1"}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleCreateTag}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-medium shadow-lg hover:shadow-xl transition-all border-0 py-5 rounded-xl"
                    disabled={createTagMutation.isPending}
                  >
                    Criar Tag
                  </Button>
                  <Button
                    onClick={() => setShowNewTagModal(false)}
                    variant="outline"
                    className="flex-1 py-5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Tag Modal */}
      <AnimatePresence>
        {editingTag && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setEditingTag(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-3xl bg-slate-950/80 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Editar Tag</h2>
                <button onClick={() => setEditingTag(null)} className="text-slate-300 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da tag"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />

                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-300">Cor:</label>
                  <input
                    type="color"
                    value={editingTag.color || "#6366f1"}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleUpdateTag}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-medium shadow-lg hover:shadow-xl transition-all border-0 py-5 rounded-xl"
                    disabled={updateTagMutation.isPending}
                  >
                    Salvar Alterações
                  </Button>
                  <Button
                    onClick={() => setEditingTag(null)}
                    variant="outline"
                    className="flex-1 py-5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* View Prompt Modal */}
      <AnimatePresence>
        {expandedPromptId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedPromptId(null)}
          >
            <motion.div
              layoutId={`prompt-card-${expandedPromptId}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-[#111318] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const prompt = prompts.find(p => p.id === expandedPromptId);
                if (!prompt) return null;
                return (
                  <>
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1a1d24]">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{prompt.title}</h2>
                        <div className="flex gap-2 flex-wrap">
                          {(prompt.tagIds || []).map((tagId: number) => {
                            const tag = tags.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tag.id}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                                style={{ color: tag.color, backgroundColor: `${tag.color || '#6366f1'}15`, borderColor: `${tag.color || '#6366f1'}30` }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(prompt.id, prompt.isFavorite)}
                          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
                        >
                          <Heart size={20} className={prompt.isFavorite ? "fill-red-500 text-red-500" : ""} />
                        </button>
                        <button
                          onClick={() => handleCopyPrompt(prompt.content)}
                          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        >
                          <Copy size={20} />
                        </button>
                        <button
                          onClick={() => setExpandedPromptId(null)}
                          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors ml-2"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-[#0b0c10] p-6">
                      <div className="prose prose-invert max-w-none">
                        <PromptEditor content={prompt.content} readOnly={true} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-3xl bg-slate-950/80 rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Exportar Prompts</h2>
                <button onClick={() => setShowExportModal(false)} className="text-slate-300 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300 text-sm">
                  Escolha o formato para exportar os {filteredPrompts.length} prompts listados atualmente.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      handleExportJSON();
                      setShowExportModal(false);
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shadow-sm py-6 rounded-xl"
                  >
                    JSON
                  </Button>
                  <Button
                    onClick={() => {
                      handleExportCSV();
                      setShowExportModal(false);
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shadow-sm py-6 rounded-xl"
                  >
                    CSV
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
