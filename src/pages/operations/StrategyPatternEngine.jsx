import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Target,
  Scale,
  BatteryCharging,
  Clock,
  ArrowRight,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  Code2,
  Flame,
} from 'lucide-react';
import {
  getAvailableStrategies,
  getStaffSuggestion,
  compareStaffStrategies,
  DEFAULT_STRATEGIES,
} from './operationsApi';

export default function StrategyPatternEngine({
  tasks = [],
  employees = [],
  onApplyStaffToTask,
}) {
  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES);
  const [selectedCategory, setSelectedCategory] = useState('Graphic Design');
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeStrategyKey, setActiveStrategyKey] = useState('role-match');
  const [comparisonResults, setComparisonResults] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testLogs, setTestLogs] = useState([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const categories = [
    'Graphic Design',
    'Video Production',
    'Copywriting',
    'Web Development',
    'Social Media',
    'General Marketing',
  ];

  // Load available strategies metadata and initial comparison
  useEffect(() => {
    async function loadMeta() {
      try {
        const strats = await getAvailableStrategies();
        if (Array.isArray(strats) && strats.length > 0) {
          setStrategies(strats);
        }
      } catch (e) {
        console.warn('Could not fetch strategies metadata:', e);
      }
    }
    loadMeta();
  }, []);

  // Fetch comparison and single suggestion whenever category or active strategy changes
  const refreshStrategyCalculations = async (cat, stratKey) => {
    setIsLoading(true);
    try {
      const [compData, singleData] = await Promise.all([
        compareStaffStrategies(cat),
        getStaffSuggestion(stratKey, cat),
      ]);
      setComparisonResults(Array.isArray(compData) ? compData : []);
      setActiveSuggestion(singleData);
    } catch (err) {
      console.warn('Error fetching strategy calculations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStrategyCalculations(selectedCategory, activeStrategyKey);
  }, [selectedCategory, activeStrategyKey]);

  // Handle task selection to auto-set category
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    if (task && task.taskCategory) {
      setSelectedCategory(task.taskCategory);
    }
  };

  // Run live runtime strategy swapping demonstration test
  const runStrategySwappingTest = async () => {
    setIsRunningTest(true);
    setTestLogs([]);
    const logs = [];

    const addLog = (msg, level = 'info') => {
      const entry = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        message: msg,
        level,
      };
      logs.push(entry);
      setTestLogs([...logs]);
    };

    addLog('🚀 Initializing StaffAssigner Context with candidates...', 'info');
    await new Promise((r) => setTimeout(r, 300));

    const candidateCount = employees.filter(
      (e) => String(e.status).toUpperCase() !== 'ON_LEAVE' && e.currentWorkload < e.maxWorkload
    ).length;
    addLog(`🔍 Context filtered ${candidateCount} eligible candidates out of ${employees.length} total staff.`, 'info');
    await new Promise((r) => setTimeout(r, 350));

    // Test each strategy sequentially to prove runtime swapping
    const stratSequence = [
      { key: 'role-match', name: 'Role Match Strategy' },
      { key: 'least-workload', name: 'Least Workload Strategy' },
      { key: 'most-capacity', name: 'Most Remaining Capacity Strategy' },
      { key: 'first-available', name: 'First Available Strategy' },
    ];

    for (const s of stratSequence) {
      addLog(`🔄 assigner.setStrategy(new ${s.name}()) -> Swapping algorithm at runtime`, 'swap');
      await new Promise((r) => setTimeout(r, 400));

      try {
        const res = await getStaffSuggestion(s.key, selectedCategory);
        if (res && res.eligible) {
          addLog(
            `✅ [${s.name}] Selected: ${res.suggestedStaffName} (${res.role}) | Workload: ${res.currentWorkload}/${res.maxWorkload} | Remaining: ${res.remainingCapacity}`,
            'success'
          );
        } else {
          addLog(`⚠️ [${s.name}] No eligible candidates found under constraints.`, 'warning');
        }
      } catch (err) {
        addLog(`❌ [${s.name}] Error: ${err.message}`, 'error');
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    addLog('✨ Strategy Pattern Verification Complete: All concrete algorithms evaluated independently!', 'finish');
    setIsRunningTest(false);
  };

  const getStrategyIcon = (key) => {
    switch (key) {
      case 'role-match':
        return <Target className="w-4 h-4 text-[#FF2E63]" />;
      case 'least-workload':
        return <Scale className="w-4 h-4 text-[#08D9D6]" />;
      case 'most-capacity':
        return <BatteryCharging className="w-4 h-4 text-emerald-400" />;
      case 'first-available':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#08D9D6]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Architecture Explanation */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161B26] via-[#252A34] to-[#1F2430] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#08D9D6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-[#FF2E63]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FF2E63] text-white shadow-xs">
                  GoF Behavioral Pattern
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#08D9D6]/20 text-[#08D9D6] border border-[#08D9D6]/30">
                  Operations Module • Staff Assignment
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Cpu className="w-6 h-6 text-[#08D9D6]" />
                Staff Assignment Strategy Engine
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
                Decouples assignment algorithms from the Task Coordinator client. Encapsulates interchangeable assignment rules (<code className="text-[#08D9D6]">StaffAssignmentStrategy</code>) inside a uniform interface, allowing runtime swapping based on team workload, specialization, capacity, or priority.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refreshStrategyCalculations(selectedCategory, activeStrategyKey)}
              disabled={isLoading}
              className="self-start md:self-center px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
              <span>Recalculate Matrix</span>
            </button>
          </div>

          {/* Architecture Visualizer Flow */}
          <div className="pt-5 grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs">
            {/* Box 1: Task Context */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Step 1 • Task Context
                </span>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#08D9D6]" />
                  Task / Category
                </h4>
                <p className="text-[11px] text-gray-300 mt-1">
                  Client submits requirements with category (e.g. <em>Graphic Design</em>).
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#08D9D6] font-mono">
                category: "{selectedCategory}"
              </div>
            </div>

            {/* Box 2: Context Class */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Step 2 • Context Class
                </span>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  StaffAssigner
                </h4>
                <p className="text-[11px] text-gray-300 mt-1">
                  Filters non-eligible staff (<code className="text-gray-300">!ON_LEAVE</code>, <code className="text-gray-300">workload &lt; max</code>) and delegates.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-purple-300 font-mono">
                assigner.suggestStaff(candidates)
              </div>
            </div>

            {/* Box 3: Strategy Interface */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Step 3 • Strategy Interface
                </span>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF2E63]" />
                  StaffAssignmentStrategy
                </h4>
                <p className="text-[11px] text-gray-300 mt-1">
                  Contract with polymorphic <code className="text-[#FF2E63]">selectStaff(...)</code> method.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#FF2E63] font-mono">
                4 Concrete Implementations
              </div>
            </div>

            {/* Box 4: Active Strategy Selection */}
            <div className="p-3.5 rounded-2xl bg-[#08D9D6]/10 border border-[#08D9D6]/30 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#08D9D6] block mb-1">
                  Step 4 • Active Strategy
                </span>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  {getStrategyIcon(activeStrategyKey)}
                  {strategies.find((s) => s.key === activeStrategyKey)?.name || activeStrategyKey}
                </h4>
                <p className="text-[11px] text-gray-200 mt-1">
                  Runtime algorithm chosen by coordinator policy.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Interchangeable at runtime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Controls: Category Selector & Pending Tasks Quick Select */}
      <div className="p-5 rounded-3xl bg-white border shadow-xs space-y-4" style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#252A34] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF2E63]" />
              Simulation Category & Context Parameters
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a task category or existing client task to evaluate how each strategy selects staff.
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTask(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#252A34] text-[#08D9D6] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Pending Client Tasks Selector */}
        {tasks.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-500 block mb-2">
              Or pick an existing client task to preview strategy recommendation:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTask(t)}
                  className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedTask?.id === t.id
                      ? 'bg-[#08D9D6]/10 border-[#08D9D6] ring-1 ring-[#08D9D6]'
                      : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#252A34] truncate">
                      #{t.id} • {t.taskTitle}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-gray-700">{t.clientName}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-white border border-gray-200 text-[10px]">
                        {t.taskCategory || 'General'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Strategy Comparison Matrix (Side-by-side Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="font-black text-base text-[#252A34] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#08D9D6]" />
              Strategy Comparison Matrix (All 4 Algorithms Side-by-Side)
            </h3>
            <p className="text-xs text-gray-500">
              Evaluated for category: <strong className="text-[#252A34]">"{selectedCategory}"</strong> with {employees.length} team members in pool.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#08D9D6]/15 text-[#252A34]">
            Runtime Comparison
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_STRATEGIES.map((strat) => {
            const result = comparisonResults.find(
              (r) => r.strategyKey === strat.key || r.strategy === strat.name
            );
            const isSelected = activeStrategyKey === strat.key;

            return (
              <div
                key={strat.key}
                onClick={() => setActiveStrategyKey(strat.key)}
                className={`rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'bg-white border-[#08D9D6] ring-2 ring-[#08D9D6]/50'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#08D9D6] text-[#252A34] shadow-xs">
                    Active Strategy
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold">
                      {strat.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#252A34]">{strat.name}</h4>
                      <span className="text-[10px] font-mono text-gray-400">
                        @{strat.key}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px]">
                    {strat.description}
                  </p>

                  {/* Picked Staff Card */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                      Strategy Selection
                    </span>

                    {result?.eligible ? (
                      <div className="space-y-1.5">
                        <div className="font-bold text-xs text-[#252A34] flex items-center justify-between">
                          <span className="truncate">{result.suggestedStaffName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold shrink-0">
                            Eligible
                          </span>
                        </div>
                        <div className="text-[11px] text-[#FF2E63] font-semibold truncate">
                          {result.role}
                        </div>

                        <div className="pt-2 border-t border-gray-200/70 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Workload</span>
                            <span className="font-bold text-gray-800">
                              {result.currentWorkload} / {result.maxWorkload}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Free Slots</span>
                            <span className="font-bold text-emerald-600">
                              +{result.remainingCapacity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 py-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{result?.message || 'No eligible staff'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {strat.requiresCategory ? 'Category-aware' : 'Category-independent'}
                  </span>
                  {result?.eligible && onApplyStaffToTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyStaffToTask(result.suggestedStaffId, selectedTask?.id);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#252A34] text-[#08D9D6] hover:bg-black font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Assign</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Live Runtime Strategy Swapping Test & Verification Console */}
      <div className="p-6 rounded-3xl bg-white border shadow-xs space-y-4" style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-[#252A34] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF2E63]" />
              Live Strategy Swapping Verification Console
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Simulates dynamic runtime strategy substitution via <code className="text-[#FF2E63]">assigner.setStrategy()</code> and verifies polymorphism.
            </p>
          </div>

          <button
            type="button"
            onClick={runStrategySwappingTest}
            disabled={isRunningTest}
            className="px-4 py-2.5 rounded-2xl bg-[#FF2E63] hover:bg-[#E02656] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isRunningTest ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isRunningTest ? 'Running Test...' : 'Run Swapping Test'}</span>
          </button>
        </div>

        {/* Test Console Output */}
        <div className="p-4 rounded-2xl bg-[#161B26] text-white font-mono text-xs space-y-2 max-h-64 overflow-y-auto border border-gray-800 shadow-inner">
          {testLogs.length === 0 ? (
            <div className="text-gray-400 py-3 text-center">
              Click <strong>"Run Swapping Test"</strong> to execute runtime strategy verification across all 4 algorithms.
            </div>
          ) : (
            testLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2.5 leading-relaxed ${
                  log.level === 'swap'
                    ? 'text-purple-300 font-bold'
                    : log.level === 'success'
                    ? 'text-emerald-400'
                    : log.level === 'warning'
                    ? 'text-amber-400'
                    : log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'finish'
                    ? 'text-[#08D9D6] font-bold'
                    : 'text-gray-300'
                }`}
              >
                <span className="text-gray-500 text-[10px] shrink-0 mt-0.5">
                  [{log.time}]
                </span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
