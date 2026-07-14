"use client";

import { useState, useRef } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Percent, 
  BarChart3, 
  Database, 
  Table, 
  Sparkles, 
  UploadCloud,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function Home() {
  // Navigation
  const [activeTab, setActiveTab] = useState("pipeline"); // "analytics" | "explorer" | "pipeline"

  // Data State
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState(""); // "json" | "csv"
  const [rawRecordsCount, setRawRecordsCount] = useState(0);
  const [deduplicatedCount, setDeduplicatedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [processingTime, setProcessingTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);
  
  // Processing state
  const [progress, setProgress] = useState(0);
  const [statusLogs, setStatusLogs] = useState([]);
  const [cleanedRecords, setCleanedRecords] = useState([]);
  const [processingMetrics, setProcessingMetrics] = useState(null);
  
  // Table View & Filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fileInputRef = useRef(null);

  // File Upload Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    setFileName(file.name);
    const extension = file.name.split('.').pop().toLowerCase();
    setFileType(extension);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        let parsed = [];
        if (extension === 'json') {
          parsed = JSON.parse(content);
        } else if (extension === 'csv') {
          parsed = parseCSV(content);
        } else {
          alert('Unsupported file format. Please upload .json or .csv');
          return;
        }

        if (!Array.isArray(parsed)) {
          alert('Invalid data format. File must contain an array of records.');
          return;
        }

        setRawRecordsCount(parsed.length);
        setFileData(parsed);

        // Check if the uploaded file is ALREADY cleaned/preprocessed
        const isPreCleaned = parsed.some(r => r.severity_level || r.english_translation || r.engagement !== undefined);

        if (isPreCleaned) {
          // Calculate programmatic fields if missing
          const calculated = parsed.map(r => {
            const reactions = parseInt(r.reactions || 0);
            const comments = parseInt(r.comments || 0);
            const mentioned_competitors = Array.isArray(r.mentioned_competitors) 
              ? r.mentioned_competitors 
              : (typeof r.mentioned_competitors === 'string' && r.mentioned_competitors ? r.mentioned_competitors.split(',').map(c => c.trim()) : []);
            
            return {
              ...r,
              reactions,
              comments,
              mentioned_competitors,
              engagement: r.engagement !== undefined ? r.engagement : (reactions + comments),
              is_competitor_comparison: r.is_competitor_comparison !== undefined ? r.is_competitor_comparison : (mentioned_competitors.length > 0),
              is_high_risk: r.is_high_risk !== undefined ? r.is_high_risk : (r.sentiment === 'negative' && (reactions + comments) > 100)
            };
          });

          setCleanedRecords(calculated);
          
          // Calculate Metrics
          let sentimentFixes = 0;
          let brandMentionFixes = 0;
          let translationsCount = 0;
          let highRiskCount = 0;
          let competitorCount = 0;

          calculated.forEach(record => {
            if (record.is_high_risk) highRiskCount++;
            if (record.is_competitor_comparison) competitorCount++;
            if (record.language !== 'en' && record.english_translation) translationsCount++;
          });

          setProcessingMetrics({
            totalRaw: parsed.length,
            duplicatesRemoved: 0,
            processed: parsed.length,
            sentimentFixes,
            brandMentionFixes,
            translationsCount,
            highRiskCount,
            competitorCount
          });

          setStatusLogs([`Loaded pre-cleaned file "${file.name}" with ${parsed.length} rows. Analytics dashboard is ready!`]);
          setActiveTab("analytics"); // Automatically go to dashboard
        } else {
          // Reset states for raw file
          setCleanedRecords([]);
          setProcessingMetrics(null);
          setStatusLogs([`Loaded raw file "${file.name}" with ${parsed.length} rows. Go to "Pipeline Console" tab to process it.`]);
          setActiveTab("pipeline"); // Stay on pipeline to clean it
        }
        
        setProgress(0);
      } catch (err) {
        alert('Error parsing file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Helper: Client-side CSV Parser
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i+1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && next === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    if (lines.length === 0) return [];
    const headers = lines[0].map(h => h.trim().toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.length !== headers.length) continue;
      const obj = {};
      headers.forEach((header, index) => {
        let val = line[index].trim();
        // Type casting
        if (header === 'id' || header === 'reactions' || header === 'comments' || header === 'sentiment_score') {
          obj[header] = parseInt(val) || 0;
        } else if (header === 'brand_mention') {
          obj[header] = val.toLowerCase() === 'true';
        } else {
          obj[header] = val;
        }
      });
      records.push(obj);
    }
    return records;
  };

  // Processing pipeline
  const processDataset = async () => {
    if (!fileData || fileData.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setProcessingTime(0);
    setFinalTime(null);
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setProcessingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    setStatusLogs(prev => [...prev, 'Starting pipeline execution...', 'Running deduplication...']);

    // 1. Deduplication on Client
    const seenTexts = new Set();
    const unique = [];
    let dupsCount = 0;

    for (const record of fileData) {
      if (!record.text) continue;
      const normalized = record.text.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seenTexts.has(normalized)) {
        seenTexts.add(normalized);
        unique.push({ ...record });
      } else {
        dupsCount++;
      }
    }

    setDeduplicatedCount(dupsCount);
    setStatusLogs(prev => [
      ...prev,
      `Deduplication complete. Removed ${dupsCount} duplicate(s).`,
      `Starting batch processing on ${unique.length} unique records...`
    ]);

    // 2. Batch Processing
    const BATCH_SIZE = 30;
    const finalCleaned = [];
    const originalMap = new Map(fileData.map(r => [r.id, { ...r }]));
    
    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
      const batch = unique.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(unique.length / BATCH_SIZE);
      
      setStatusLogs(prev => [...prev, `[Batch ${batchNum}/${totalBatches}] Sending request to LLM API...`]);
      
      try {
        const res = await fetch('/api/clean/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: batch, model: selectedModel })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server error during batch processing');
        }
        
        const data = await res.json();
        const batchResults = data.records;

        // Apply programmatic feature engineering
        const resultMap = new Map(batchResults.map(item => [item.id, item]));

        for (const record of batch) {
          const result = resultMap.get(record.id);
          if (result) {
            record.sentiment = result.sentiment;
            record.sentiment_score = result.sentiment_score;
            record.english_translation = result.english_translation;
            record.severity_level = result.severity_level;
            record.mentioned_competitors = result.mentioned_competitors || [];
            record.brand_mention = result.brand_mention;
          }

          // Programmatic fields
          const reactions = parseInt(record.reactions || 0);
          const comments = parseInt(record.comments || 0);
          record.engagement = reactions + comments;
          record.mentioned_competitors = record.mentioned_competitors || [];
          record.is_competitor_comparison = record.mentioned_competitors.length > 0;
          record.is_high_risk = record.sentiment === 'negative' && record.engagement > 100;
          
          finalCleaned.push(record);
        }

        setStatusLogs(prev => [...prev, `[Batch ${batchNum}/${totalBatches}] Successfully cleaned.`]);
      } catch (err) {
        setStatusLogs(prev => [
          ...prev, 
          `[Batch ${batchNum}/${totalBatches}] Failed: ${err.message}. Using original values as fallback.`
        ]);
        
        // Fallback mapping
        for (const record of batch) {
          record.sentiment = record.sentiment || 'neutral';
          record.sentiment_score = record.sentiment_score || 50;
          record.english_translation = record.text;
          record.severity_level = 'Low';
          record.mentioned_competitors = [];
          record.brand_mention = record.brand_mention || false;
          record.engagement = parseInt(record.reactions || 0) + parseInt(record.comments || 0);
          record.is_competitor_comparison = false;
          record.is_high_risk = false;
          
          finalCleaned.push(record);
        }
      }

      // Calculate progress percentage
      const percent = Math.min(10 + Math.floor(((i + batch.length) / unique.length) * 90), 100);
      setProgress(percent);

      // Delay to respect rate limits
      if (i + BATCH_SIZE < unique.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. Compute Metrics
    let sentimentFixes = 0;
    let brandMentionFixes = 0;
    let translationsCount = 0;
    let highRiskCount = 0;
    let competitorCount = 0;

    for (const record of finalCleaned) {
      const orig = originalMap.get(record.id);
      if (orig) {
        if (record.sentiment !== orig.sentiment) sentimentFixes++;
        if (record.brand_mention !== orig.brand_mention) brandMentionFixes++;
        if (record.language !== 'en' && record.english_translation && record.english_translation !== orig.text) {
          translationsCount++;
        }
        if (record.is_high_risk) highRiskCount++;
        if (record.is_competitor_comparison) competitorCount++;
      }
    }

    setProcessingMetrics({
      totalRaw: fileData.length,
      duplicatesRemoved: dupsCount,
      processed: unique.length,
      sentimentFixes,
      brandMentionFixes,
      translationsCount,
      highRiskCount,
      competitorCount
    });

    clearInterval(timerInterval);
    const finalDuration = Math.floor((Date.now() - startTime) / 1000);
    setFinalTime(finalDuration);

    setCleanedRecords(finalCleaned);
    setIsProcessing(false);
    setProgress(100);
    setStatusLogs(prev => [...prev, `Data cleaning pipeline execution finished successfully in ${finalDuration}s!`]);
    setActiveTab("analytics"); // Automatically switch to analytics when done
  };

  // Convert cleaned records to CSV string
  const generateCSVContent = (records) => {
    if (records.length === 0) return '';
    const headers = [
      'id', 'platform', 'timestamp', 'author', 'text', 'language', 'brand_mention',
      'sentiment', 'sentiment_score', 'topic', 'reactions', 'comments',
      'english_translation', 'severity_level', 'mentioned_competitors',
      'engagement', 'is_competitor_comparison', 'is_high_risk'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const record of records) {
      const values = headers.map(header => {
        let val = record[header];
        if (val === undefined || val === null) {
          val = '';
        } else if (Array.isArray(val)) {
          val = `"${val.join(', ').replace(/"/g, '""')}"`;
        } else if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  // Downloads
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanedRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${fileName.replace(/\.[^/.]+$/, "")}_cleaned.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadCSV = () => {
    const csvContent = generateCSVContent(cleanedRecords);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${fileName.replace(/\.[^/.]+$/, "")}_cleaned.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter & Search Logic
  const filteredRecords = cleanedRecords.filter(r => {
    const matchesSearch = r.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.english_translation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;
    const matchesSeverity = severityFilter === 'all' || r.severity_level === severityFilter;
    const matchesRisk = riskFilter === 'all' || (riskFilter === 'high_risk' && r.is_high_risk);

    return matchesSearch && matchesSentiment && matchesSeverity && matchesRisk;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // --- ANALYTICS COMPUTATIONS ---
  const relevantRecords = cleanedRecords.filter(r => r.brand_mention !== false && r.topic !== 'off_topic');
  const totalRelevant = relevantRecords.length;

  const countPositive = relevantRecords.filter(r => r.sentiment === 'positive').length;
  const countNegative = relevantRecords.filter(r => r.sentiment === 'negative').length;
  const countNeutral = relevantRecords.filter(r => r.sentiment === 'neutral').length;

  // 1. Net Sentiment Score (Positive% - Negative%)
  const positivePercent = totalRelevant > 0 ? (countPositive / totalRelevant) * 100 : 0;
  const negativePercent = totalRelevant > 0 ? (countNegative / totalRelevant) * 100 : 0;
  const netSentimentScore = Math.round(positivePercent - negativePercent);

  // 2. Brand Engagement Reach (reactions + comments)
  const totalEngagement = relevantRecords.reduce((sum, r) => sum + (r.engagement || 0), 0);

  // 3. High Risk Crisis Alert Counts
  const highRiskCrisisCount = relevantRecords.filter(r => r.is_high_risk).length;

  // 4. Brand Purity Relevance Ratio
  const relevanceRatio = cleanedRecords.length > 0 
    ? Math.round((totalRelevant / cleanedRecords.length) * 100) 
    : 0;

  // 5. Pie Chart Data (Sentiment Breakdown)
  const sentimentChartData = [
    { name: 'Positive', value: countPositive, color: '#10b981' },
    { name: 'Neutral', value: countNeutral, color: '#6b7280' },
    { name: 'Negative', value: countNegative, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // 6. Stacked Bar Chart Data (Topic Sentiment breakdown)
  const topicBreakdownMap = {};
  relevantRecords.forEach(r => {
    if (!topicBreakdownMap[r.topic]) {
      topicBreakdownMap[r.topic] = { topic: r.topic, positive: 0, neutral: 0, negative: 0, total: 0 };
    }
    topicBreakdownMap[r.topic][r.sentiment] = (topicBreakdownMap[r.topic][r.sentiment] || 0) + 1;
    topicBreakdownMap[r.topic].total += 1;
  });

  const topicChartData = Object.values(topicBreakdownMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8); // Top 8 topics to prevent overcrowding

  // 7. Fire Feed (Top 4 critical crisis posts)
  const viralCrisisFeed = [...relevantRecords]
    .filter(r => r.sentiment === 'negative')
    .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
    .slice(0, 4);

  // 8. Competitor simple metrics
  const competitorPosts = cleanedRecords.filter(r => r.is_competitor_comparison);
  const totalCompetitorMentions = competitorPosts.length;
  const competitorSentimentAvg = competitorPosts.length > 0
    ? Math.round((competitorPosts.filter(r => r.sentiment === 'negative').length / competitorPosts.length) * 100)
    : 0;

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[rgba(255,255,255,0.08)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              TakaPay Media Analyzer
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Visual brand health analytics and data cleaning powered by Llama 3 & Gemini.
          </p>
        </div>

        {/* Global Dataset Status */}
        {cleanedRecords.length > 0 && (
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
            <Database className="w-4 h-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Active File</span>
              <span className="text-xs font-bold text-white max-w-[150px] truncate">{fileName} ({cleanedRecords.length} rows)</span>
            </div>
          </div>
        )}
      </header>

      {/* Tabs Selector Navigation */}
      {cleanedRecords.length > 0 && (
        <div className="flex border-b border-white/5 pb-0.5 gap-2">
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'analytics' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Executive Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("explorer")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'explorer' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            Data Explorer
          </button>
          <button 
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'pipeline' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Pipeline Console {isProcessing && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
          </button>
        </div>
      )}

      {/* TAB 1: EXECUTIVE ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && cleanedRecords.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Dashboard KPI Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Net Sentiment */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] uppercase font-extrabold tracking-wider">Net Brand Sentiment</span>
                <Percent className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-4xl font-extrabold tracking-tight ${netSentimentScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netSentimentScore >= 0 ? `+${netSentimentScore}%` : `${netSentimentScore}%`}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                Positive mentions minus negative mentions.
              </p>
            </div>

            {/* KPI 2: Total Reach / Engagement */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] uppercase font-extrabold tracking-wider">Customer Reach</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-white">
                  {totalEngagement.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                Total social reactions + comments analyzed.
              </p>
            </div>

            {/* KPI 3: High Risk Crisis */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] uppercase font-extrabold tracking-wider">Critical Incidents</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-4xl font-extrabold tracking-tight ${highRiskCrisisCount > 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                  {highRiskCrisisCount}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                Viral negative posts requiring urgent action.
              </p>
              {highRiskCrisisCount > 0 && <span className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />}
            </div>

            {/* KPI 4: Brand Relevance */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] uppercase font-extrabold tracking-wider">Mentions Relevance</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-emerald-400">
                  {relevanceRatio}%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                Percentage of relevant comments (Filtered out {relevanceRatio > 0 ? 100 - relevanceRatio : 0}% noise).
              </p>
            </div>
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sentiment Donut Chart (2/5 Cols) */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[350px]">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-4">
                Overall Sentiment Distribution
              </h3>
              <div className="h-60 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentChartData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text of Donut */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-white block leading-none">{totalRelevant}</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold mt-1 block">Voices</span>
                </div>
              </div>
            </div>

            {/* Stacked Topic Bar Chart (3/5 Cols) */}
            <div className="lg:col-span-3 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[350px]">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-4">
                Top Issues & Promos (Topic Analysis)
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topicChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={9} />
                    <YAxis dataKey="topic" type="category" stroke="#9ca3af" fontSize={9} width={90} />
                    <Tooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
                    <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="Neutral" />
                    <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Competitor Battleground & Crisis Fire Feed Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Competitor Battleground (1/3 Cols) */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[280px]">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-4 flex items-center justify-between">
                  Competitor Threat
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/10 font-bold uppercase">NgoodPay</span>
                </h3>
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Total Mention Volume</span>
                    <span className="text-base font-extrabold text-white">{totalCompetitorMentions} posts</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Threat Sentiment Level</span>
                    <span className="text-xs font-bold text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded border border-rose-500/10 uppercase">
                      {competitorSentimentAvg}% Negative
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                    Users are frequently comparing TakaPay against competitor **NgoodPay** on cashback incentives, charges, and transaction speed.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setActiveTab("explorer"); setSearchTerm("NgoodPay"); }}
                className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/5 flex items-center justify-center gap-1.5 transition-colors"
              >
                Inspect Competitor Posts
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Crisis Fire Feed (2/3 Cols) */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[280px]">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-400 mb-4 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                  Viral Crisis Feed (High Engagement Failures)
                </h3>
                <div className="flex flex-col gap-3">
                  {viralCrisisFeed.map((post) => (
                    <div key={post.id} className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-xl flex items-start gap-3 hover:bg-rose-950/20 transition-colors">
                      <div className="flex flex-col items-center justify-center bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded text-center min-w-[50px]">
                        <span className="text-[9px] text-rose-400 font-extrabold uppercase leading-none">Reach</span>
                        <span className="text-sm font-extrabold text-white mt-1 leading-none">{post.engagement}</span>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span className="font-bold text-rose-400">@{post.author} • {post.platform}</span>
                          <span className="bg-rose-500/10 text-rose-300 px-1.5 py-0.2 rounded font-semibold text-[8px] uppercase">{post.severity_level}</span>
                        </div>
                        <p className="text-xs text-white line-clamp-1">{post.text}</p>
                        {post.english_translation && post.english_translation !== post.text && (
                          <p className="text-[10px] text-indigo-300/80 italic line-clamp-1">EN: {post.english_translation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {viralCrisisFeed.length === 0 && (
                    <span className="text-xs text-gray-500 text-center py-6">No critical negative incidents found.</span>
                  )}
                </div>
              </div>
            </div>

          </section>
        </div>
      )}

      {/* TAB 2: DATA EXPLORER (TABLE VIEW) */}
      {activeTab === 'explorer' && cleanedRecords.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-400" />
              Cleaned Data Explorer
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={downloadJSON}
                className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
              <button 
                onClick={downloadCSV}
                className="px-3.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search comments..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="glass-input pl-9 pr-3 py-1.5 text-xs rounded-lg w-full"
              />
            </div>
            <select 
              value={sentimentFilter} 
              onChange={(e) => { setSentimentFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
            <select 
              value={severityFilter} 
              onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select 
              value={riskFilter} 
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer"
            >
              <option value="all">All Risks</option>
              <option value="high_risk">High Risk Crisis</option>
            </select>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/5">
                  <th className="p-3 text-center w-12">ID</th>
                  <th className="p-3">Feedback Message</th>
                  <th className="p-3 w-32 text-center whitespace-nowrap">Sentiment</th>
                  <th className="p-3 w-20 text-center">Severity</th>
                  <th className="p-3 w-20 text-center">Risk</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-center text-gray-500 font-mono">{r.id}</td>
                    <td className="p-3 flex flex-col gap-1 max-w-[340px] md:max-w-md">
                      <span className="text-white font-medium line-clamp-2">{r.text}</span>
                      {r.english_translation && r.english_translation !== r.text && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 self-start italic">
                          EN: {r.english_translation}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                        r.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        r.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {r.sentiment} ({r.sentiment_score})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.severity_level === 'Urgent' ? 'bg-rose-950 text-rose-300 border border-rose-500/30' :
                        r.severity_level === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                        r.severity_level === 'Medium' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                        'bg-white/5 text-gray-400'
                      }`}>
                        {r.severity_level}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {r.is_high_risk ? (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse border border-rose-400" title="High Engagement Crisis" />
                      ) : (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-700" title="Low Risk" />
                      )}
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No records match filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
              <span>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} entries</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <span className="px-3 py-1 text-white bg-white/10 border border-white/10 rounded">{currentPage} / {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATA PREPROCESSING PIPELINE & UPLOAD CONSOLE */}
      {(activeTab === 'pipeline' || cleanedRecords.length === 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Upload and Settings */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* File Upload Panel */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`glass-panel p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all duration-300 ${
                fileName ? 'border-indigo-500/50 bg-indigo-950/10' : 'border-white/10 hover:border-indigo-500/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json,.csv"
                className="hidden" 
              />
              <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-4 border border-indigo-500/20">
                <UploadCloud className="w-8 h-8" />
              </div>
              {fileName ? (
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 truncate max-w-[240px]">{fileName}</h3>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{fileType} • {rawRecordsCount} rows</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Drag & Drop Dataset</h3>
                  <p className="text-xs text-gray-400">Supports raw or pre-cleaned .json or .csv files</p>
                </div>
              )}
            </div>

            {/* Action and Progress Bar */}
            {fileData && (
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400 font-medium">Select Language Model:</span>
                  <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isProcessing}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-indigo-950/20 border border-indigo-500/20 cursor-pointer focus:outline-none"
                  >
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Fast)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Very Fast)</option>
                  </select>
                </div>

                <button 
                  onClick={processDataset}
                  disabled={isProcessing}
                  className="glow-button w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-center transition-all duration-300 cursor-pointer"
                >
                  {isProcessing ? 'Processing Batches...' : 'Execute Preprocessing Pipeline'}
                </button>

                {/* Real-time progress bar & Timer */}
                {(isProcessing || progress > 0) && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-indigo-400">Processing Progress</span>
                      <span className="text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-medium">
                      <span>
                        {isProcessing ? (
                          <>Time Elapsed: <span className="text-white font-mono">{processingTime}s</span></>
                        ) : finalTime !== null ? (
                          <>Completed in <span className="text-emerald-400 font-bold">{finalTime}s!</span></>
                        ) : null}
                      </span>
                      <span>{isProcessing ? 'Status: processing' : 'Status: finished'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Log Console and Processing Metrics */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Preprocessing Statistics Cards */}
            {processingMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Duplicates Removed</span>
                  <span className="text-2xl font-bold text-amber-400 mt-1">{processingMetrics.duplicatesRemoved}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Sentiment Corrected</span>
                  <span className="text-2xl font-bold text-indigo-400 mt-1">{processingMetrics.sentimentFixes}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Translations Made</span>
                  <span className="text-2xl font-bold text-pink-400 mt-1">{processingMetrics.translationsCount}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">High Risk Crisis</span>
                  <span className="text-2xl font-bold text-rose-500 mt-1">{processingMetrics.highRiskCount}</span>
                </div>
              </div>
            )}

            {/* Log Console */}
            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col min-h-[300px]">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
                Pipeline Live Logs
              </h3>
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-gray-300 flex-1 overflow-y-auto flex flex-col gap-1.5">
                {statusLogs.map((log, index) => (
                  <div key={index} className="border-l border-white/10 pl-2">
                    <span className="text-indigo-400 mr-1.5">$</span>
                    {log}
                  </div>
                ))}
                {statusLogs.length === 0 && (
                  <span className="text-gray-500">Awaiting file upload...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
