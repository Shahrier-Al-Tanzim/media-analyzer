"use client";

import { useState, useRef, useEffect } from 'react';
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
  ShieldAlert,
  Calendar,
  Layers,
  Sparkle,
  RefreshCw,
  Trash2
} from 'lucide-react';

// Custom Recharts Legend Renderer to enforce "Positive -> Neutral -> Negative" order
const renderCustomLegend = (props) => {
  const { payload } = props;
  if (!payload) return null;
  
  const order = { 'Positive': 1, 'Neutral': 2, 'Negative': 3 };
  const sortedPayload = [...payload].sort((a, b) => {
    const valA = a.value || '';
    const valB = b.value || '';
    return (order[valA] || 99) - (order[valB] || 99);
  });

  return (
    <div className="flex justify-center gap-4 mt-3 text-[11px] font-semibold text-gray-400">
      {sortedPayload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  // Navigation: starts on executive dashboard welcome state
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics" | "explorer" | "pipeline"

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
  
  // Analytics Dashboard Filtering state
  const [analyticsSearchTerm, setAnalyticsSearchTerm] = useState("");
  const [analyticsPlatformFilter, setAnalyticsPlatformFilter] = useState("all");
  const [analyticsSentimentFilter, setAnalyticsSentimentFilter] = useState("all");
  const [analyticsTopicFilter, setAnalyticsTopicFilter] = useState("all");
  const [analyticsStartDateFilter, setAnalyticsStartDateFilter] = useState("2026-06-01");
  const [analyticsEndDateFilter, setAnalyticsEndDateFilter] = useState("2026-06-30");

  // Data Explorer Filtering state
  const [explorerSearchTerm, setExplorerSearchTerm] = useState("");
  const [explorerSentimentFilter, setExplorerSentimentFilter] = useState("all");
  const [explorerTopicFilter, setExplorerTopicFilter] = useState("all");
  const [explorerSeverityFilter, setExplorerSeverityFilter] = useState("all");
  const [explorerRiskFilter, setExplorerRiskFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fileInputRef = useRef(null);
  const logContainerRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const isStopRequestedRef = useRef(false);

  // Load state from localStorage on page mount
  useEffect(() => {
    try {
      const storedFileName = localStorage.getItem('media_analyzer_file_name');
      const storedFileType = localStorage.getItem('media_analyzer_file_type');
      const storedRawCount = localStorage.getItem('media_analyzer_raw_count');
      const storedDeduplicatedCount = localStorage.getItem('media_analyzer_deduplicated_count');
      const storedFinalTime = localStorage.getItem('media_analyzer_final_time');
      
      const storedFileData = localStorage.getItem('media_analyzer_file_data');
      const storedCleanedRecords = localStorage.getItem('media_analyzer_cleaned_records');
      const storedMetrics = localStorage.getItem('media_analyzer_metrics');
      const storedLogs = localStorage.getItem('media_analyzer_logs');

      if (storedFileName) setFileName(storedFileName);
      if (storedFileType) setFileType(storedFileType);
      if (storedRawCount) setRawRecordsCount(parseInt(storedRawCount, 10));
      if (storedDeduplicatedCount) setDeduplicatedCount(parseInt(storedDeduplicatedCount, 10));
      if (storedFinalTime) setFinalTime(parseInt(storedFinalTime, 10));

      if (storedFileData) setFileData(JSON.parse(storedFileData));
      if (storedCleanedRecords) setCleanedRecords(JSON.parse(storedCleanedRecords));
      if (storedMetrics) setProcessingMetrics(JSON.parse(storedMetrics));
      if (storedLogs) setStatusLogs(JSON.parse(storedLogs));
    } catch (e) {
      console.error('Error loading persisted state:', e);
    } finally {
      hasLoadedRef.current = true;
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    
    if (fileName) {
      localStorage.setItem('media_analyzer_file_name', fileName);
      localStorage.setItem('media_analyzer_file_type', fileType);
      localStorage.setItem('media_analyzer_raw_count', rawRecordsCount.toString());
      localStorage.setItem('media_analyzer_deduplicated_count', deduplicatedCount.toString());
      if (finalTime !== null) {
        localStorage.setItem('media_analyzer_final_time', finalTime.toString());
      } else {
        localStorage.removeItem('media_analyzer_final_time');
      }
      
      if (fileData) localStorage.setItem('media_analyzer_file_data', JSON.stringify(fileData));
      if (cleanedRecords) localStorage.setItem('media_analyzer_cleaned_records', JSON.stringify(cleanedRecords));
      if (processingMetrics) localStorage.setItem('media_analyzer_metrics', JSON.stringify(processingMetrics));
      if (statusLogs) localStorage.setItem('media_analyzer_logs', JSON.stringify(statusLogs));
    } else {
      localStorage.removeItem('media_analyzer_file_name');
      localStorage.removeItem('media_analyzer_file_type');
      localStorage.removeItem('media_analyzer_raw_count');
      localStorage.removeItem('media_analyzer_deduplicated_count');
      localStorage.removeItem('media_analyzer_final_time');
      localStorage.removeItem('media_analyzer_file_data');
      localStorage.removeItem('media_analyzer_cleaned_records');
      localStorage.removeItem('media_analyzer_metrics');
      localStorage.removeItem('media_analyzer_logs');
    }
  }, [fileName, fileType, rawRecordsCount, deduplicatedCount, finalTime, fileData, cleanedRecords, processingMetrics, statusLogs]);

  // Auto scroll logs console to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [statusLogs]);

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
            const reactions = parseInt(r.reactions || 0, 10);
            const comments = parseInt(r.comments || 0, 10);
            const mentioned_competitors = Array.isArray(r.mentioned_competitors) 
              ? r.mentioned_competitors 
              : (typeof r.mentioned_competitors === 'string' && r.mentioned_competitors ? r.mentioned_competitors.split(',').map(c => c.trim()) : []);
            
            return {
              ...r,
              reactions,
              comments,
              mentioned_competitors,
              engagement: r.engagement !== undefined ? parseInt(r.engagement, 10) : (reactions + comments),
              is_competitor_comparison: r.is_competitor_comparison !== undefined ? (r.is_competitor_comparison === true || r.is_competitor_comparison === 'true' || r.is_competitor_comparison === 'TRUE') : (mentioned_competitors.length > 0),
              is_high_risk: r.is_high_risk !== undefined ? (r.is_high_risk === true || r.is_high_risk === 'true' || r.is_high_risk === 'TRUE') : (r.sentiment === 'negative' && (reactions + comments) > 100),
              competitor_sentiment: r.competitor_sentiment !== undefined ? r.competitor_sentiment : null
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
          setStatusLogs([`Loaded raw file "${file.name}" with ${parsed.length} rows. Go to "Data Cleaner" tab to process it.`]);
          setActiveTab("pipeline"); // Switch to data cleaner console to clean it
        }
        
        setProgress(0);
      } catch (err) {
        alert('Error parsing file: ' + err.message);
      } finally {
        // ALWAYS reset the file input value so the same file can be uploaded again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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
        } else if (header === 'brand_mention' || header === 'is_high_risk' || header === 'is_competitor_comparison') {
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
    isStopRequestedRef.current = false;
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
      if (isStopRequestedRef.current) {
        setStatusLogs(prev => [...prev, '🛑 Pipeline execution cancelled by user.']);
        setIsProcessing(false);
        clearInterval(timerInterval);
        return;
      }
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
            record.competitor_sentiment = result.competitor_sentiment || null;
          }

          // Programmatic fields
          const reactions = parseInt(record.reactions || 0, 10);
          const comments = parseInt(record.comments || 0, 10);
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
          record.engagement = parseInt(record.reactions || 0, 10) + parseInt(record.comments || 0, 10);
          record.is_competitor_comparison = false;
          record.is_high_risk = false;
          record.competitor_sentiment = null;
          
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
      'engagement', 'is_competitor_comparison', 'is_high_risk', 'competitor_sentiment'
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

  // Filter & Search Logic for Data Explorer (Table)
  const filteredRecordsExplorer = cleanedRecords.filter(r => {
    const matchesSearch = r.text.toLowerCase().includes(explorerSearchTerm.toLowerCase()) || 
                          r.english_translation?.toLowerCase().includes(explorerSearchTerm.toLowerCase()) ||
                          r.author.toLowerCase().includes(explorerSearchTerm.toLowerCase());
    
    const matchesSentiment = explorerSentimentFilter === 'all' || r.sentiment === explorerSentimentFilter;
    const matchesSeverity = explorerSeverityFilter === 'all' || r.severity_level === explorerSeverityFilter;
    const matchesRisk = explorerRiskFilter === 'all' || (explorerRiskFilter === 'high_risk' && r.is_high_risk);
    const matchesTopic = explorerTopicFilter === 'all' || r.topic === explorerTopicFilter;
    
    return matchesSearch && matchesSentiment && matchesSeverity && matchesRisk && matchesTopic;
  });

  // Filter & Search Logic for Executive Dashboard
  const filteredRecordsAnalytics = cleanedRecords.filter(r => {
    const matchesSearch = r.text.toLowerCase().includes(analyticsSearchTerm.toLowerCase()) || 
                          r.english_translation?.toLowerCase().includes(analyticsSearchTerm.toLowerCase()) ||
                          r.author.toLowerCase().includes(analyticsSearchTerm.toLowerCase());
    
    const matchesSentiment = analyticsSentimentFilter === 'all' || r.sentiment === analyticsSentimentFilter;
    const matchesPlatform = analyticsPlatformFilter === 'all' || r.platform.toLowerCase() === analyticsPlatformFilter.toLowerCase();
    const matchesTopic = analyticsTopicFilter === 'all' || r.topic === analyticsTopicFilter;
    
    let matchesDate = true;
    if (r.timestamp && r.timestamp.length >= 10) {
      const rowDate = r.timestamp.substring(0, 10);
      matchesDate = rowDate >= analyticsStartDateFilter && rowDate <= analyticsEndDateFilter;
    }

    return matchesSearch && matchesSentiment && matchesPlatform && matchesDate && matchesTopic;
  });

  // Pagination Logic (Uses Explorer filtered records)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecordsExplorer.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecordsExplorer.length / itemsPerPage);

  // --- ANALYTICS COMPUTATIONS (Uses Analytics filtered records) ---
  const relevantRecords = filteredRecordsAnalytics.filter(r => r.brand_mention !== false && r.topic !== 'off_topic');
  const totalRelevant = relevantRecords.length;

  const countPositive = relevantRecords.filter(r => r.sentiment === 'positive').length;
  const countNegative = relevantRecords.filter(r => r.sentiment === 'negative').length;
  const countNeutral = relevantRecords.filter(r => r.sentiment === 'neutral').length;

  // 1. Net Sentiment Score (Positive% - Negative%)
  const positivePercent = totalRelevant > 0 ? (countPositive / totalRelevant) * 100 : 0;
  const negativePercent = totalRelevant > 0 ? (countNegative / totalRelevant) * 100 : 0;
  const netSentimentScore = Math.round(positivePercent - negativePercent);

  // 2. Brand Engagement Reach (reactions + comments)
  const totalEngagement = relevantRecords.reduce((sum, r) => sum + (parseInt(r.engagement, 10) || 0), 0);

  // 3. High Risk Crisis Alert Counts
  const highRiskCrisisCount = relevantRecords.filter(r => r.is_high_risk).length;

  // 4. Brand Purity Relevance Ratio
  const relevanceRatio = filteredRecordsAnalytics.length > 0 
    ? Math.round((totalRelevant / filteredRecordsAnalytics.length) * 100) 
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
    .filter(t => t.topic !== 'competitor')
    .sort((a, b) => b.total - a.total)
    .slice(0, 8); // Top 8 topics to prevent overcrowding

  // 7. Platform Sentiment Breakdown Chart (Positive, Neutral, Negative proportions)
  const platformBreakdownMap = {};
  filteredRecordsAnalytics.forEach(r => {
    if (!platformBreakdownMap[r.platform]) {
      platformBreakdownMap[r.platform] = { name: r.platform, positive: 0, neutral: 0, negative: 0, total: 0 };
    }
    platformBreakdownMap[r.platform].total += 1;
    platformBreakdownMap[r.platform][r.sentiment] = (platformBreakdownMap[r.platform][r.sentiment] || 0) + 1;
  });

  const platformSentimentData = Object.values(platformBreakdownMap).map(p => ({
    name: p.name,
    'Positive': p.total > 0 ? Math.round((p.positive / p.total) * 100) : 0,
    'Neutral': p.total > 0 ? Math.round((p.neutral / p.total) * 100) : 0,
    'Negative': p.total > 0 ? Math.round((p.negative / p.total) * 100) : 0,
    positiveCount: p.positive,
    neutralCount: p.neutral,
    negativeCount: p.negative,
    totalCount: p.total
  })).sort((a, b) => b['Negative'] - a['Negative']); // Keep sorted by highest negativity concentration first

  // 8. TakaPay vs NgoodPay strengths/weaknesses grouped bar chart (Positive sentiment percentage)
  let countSpeedNgoodPayPositive = 0;
  let countSpeedNgoodPayTotal = 0;
  let countSpeedTakaPayPositive = 0;
  let countSpeedTakaPayTotal = 0;

  let countAgentNgoodPayPositive = 0;
  let countAgentNgoodPayTotal = 0;
  let countAgentTakaPayPositive = 0;
  let countAgentTakaPayTotal = 0;

  let countCashbackNgoodPayPositive = 0;
  let countCashbackNgoodPayTotal = 0;
  let countCashbackTakaPayPositive = 0;
  let countCashbackTakaPayTotal = 0;

  let countRechargeNgoodPayPositive = 0;
  let countRechargeNgoodPayTotal = 0;
  let countRechargeTakaPayPositive = 0;
  let countRechargeTakaPayTotal = 0;

  let countChargesNgoodPayPositive = 0;
  let countChargesNgoodPayTotal = 0;
  let countChargesTakaPayPositive = 0;
  let countChargesTakaPayTotal = 0;

  filteredRecordsAnalytics.forEach(r => {
    const textLower = r.text.toLowerCase();
    const hasNgoodPay = textLower.includes('ngoodpay');
    // Assume TakaPay is mentioned if explicitly flagged, or if the text has TakaPay, or if it is a general post (not competitor-only)
    const hasTakaPay = textLower.includes('takapay') || r.brand_mention === true || r.brand_mention === 'true' || !hasNgoodPay;
    
    const isTakaPayPositive = r.sentiment === 'positive';
    
    // Independent competitor sentiment calculation with legacy text fallback
    let isNgoodPayPositive = r.competitor_sentiment === 'positive';
    if (r.competitor_sentiment === undefined || r.competitor_sentiment === null) {
      const transLower = (r.english_translation || '').toLowerCase();
      const hasPositiveWord = textLower.includes('valo') || textLower.includes('bhala') || transLower.includes('good') || transLower.includes('great') || transLower.includes('fast') || transLower.includes('smooth') || transLower.includes('awesome') || transLower.includes('impressed') || transLower.includes('better') || transLower.includes('best') || transLower.includes('praise');
      const hasNegativeWord = textLower.includes('kharap') || textLower.includes('pending') || transLower.includes('bad') || transLower.includes('slow') || transLower.includes('worst') || transLower.includes('charge') || transLower.includes('robbery') || transLower.includes('fee');
      if (hasPositiveWord && !hasNegativeWord) {
        isNgoodPayPositive = true;
      }
    }

    // 1. App Speed
    if (textLower.includes('speed') || textLower.includes('fast') || textLower.includes('slow') || textLower.includes('pending') || textLower.includes('atke')) {
      if (hasNgoodPay) {
        countSpeedNgoodPayTotal++;
        if (isNgoodPayPositive) countSpeedNgoodPayPositive++;
      }
      if (hasTakaPay) {
        countSpeedTakaPayTotal++;
        if (isTakaPayPositive) countSpeedTakaPayPositive++;
      }
    }
    // 2. Agent Network
    if (textLower.includes('agent') || textLower.includes('network') || textLower.includes('area') || textLower.includes('location') || textLower.includes('pabo')) {
      if (hasNgoodPay) {
        countAgentNgoodPayTotal++;
        if (isNgoodPayPositive) countAgentNgoodPayPositive++;
      }
      if (hasTakaPay) {
        countAgentTakaPayTotal++;
        if (isTakaPayPositive) countAgentTakaPayPositive++;
      }
    }
    // 3. Cashback Offers
    if (textLower.includes('cashback') || textLower.includes('offer') || textLower.includes('bonus') || textLower.includes('discount')) {
      if (hasNgoodPay) {
        countCashbackNgoodPayTotal++;
        if (isNgoodPayPositive) countCashbackNgoodPayPositive++;
      }
      if (hasTakaPay) {
        countCashbackTakaPayTotal++;
        if (isTakaPayPositive) countCashbackTakaPayPositive++;
      }
    }
    // 4. Mobile Recharge
    if (textLower.includes('recharge') || textLower.includes('bill') || textLower.includes('load')) {
      if (hasNgoodPay) {
        countRechargeNgoodPayTotal++;
        if (isNgoodPayPositive) countRechargeNgoodPayPositive++;
      }
      if (hasTakaPay) {
        countRechargeTakaPayTotal++;
        if (isTakaPayPositive) countRechargeTakaPayPositive++;
      }
    }
    // 5. Charges & Fees
    if (textLower.includes('fee') || textLower.includes('charge') || textLower.includes('cost') || textLower.includes('limit') || textLower.includes('expensive')) {
      if (hasNgoodPay) {
        countChargesNgoodPayTotal++;
        if (isNgoodPayPositive) countChargesNgoodPayPositive++;
      }
      if (hasTakaPay) {
        countChargesTakaPayTotal++;
        if (isTakaPayPositive) countChargesTakaPayPositive++;
      }
    }
  });

  const competitorComparisonData = [
    { 
      name: 'Charges & Fees', 
      'TakaPay': countChargesTakaPayTotal > 0 ? Math.round((countChargesTakaPayPositive / countChargesTakaPayTotal) * 100) : 0, 
      'NgoodPay': countChargesNgoodPayTotal > 0 ? Math.round((countChargesNgoodPayPositive / countChargesNgoodPayTotal) * 100) : 0,
      takaPayPos: countChargesTakaPayPositive,
      takaPayTotal: countChargesTakaPayTotal,
      ngoodPayPos: countChargesNgoodPayPositive,
      ngoodPayTotal: countChargesNgoodPayTotal
    },
    { 
      name: 'Cashback Offers', 
      'TakaPay': countCashbackTakaPayTotal > 0 ? Math.round((countCashbackTakaPayPositive / countCashbackTakaPayTotal) * 100) : 0, 
      'NgoodPay': countCashbackNgoodPayTotal > 0 ? Math.round((countCashbackNgoodPayPositive / countCashbackNgoodPayTotal) * 100) : 0,
      takaPayPos: countCashbackTakaPayPositive,
      takaPayTotal: countCashbackTakaPayTotal,
      ngoodPayPos: countCashbackNgoodPayPositive,
      ngoodPayTotal: countCashbackNgoodPayTotal
    },
    { 
      name: 'Recharges & Bills', 
      'TakaPay': countRechargeTakaPayTotal > 0 ? Math.round((countRechargeTakaPayPositive / countRechargeTakaPayTotal) * 100) : 0, 
      'NgoodPay': countRechargeNgoodPayTotal > 0 ? Math.round((countRechargeNgoodPayPositive / countRechargeNgoodPayTotal) * 100) : 0,
      takaPayPos: countRechargeTakaPayPositive,
      takaPayTotal: countRechargeTakaPayTotal,
      ngoodPayPos: countRechargeNgoodPayPositive,
      ngoodPayTotal: countRechargeNgoodPayTotal
    },
    { 
      name: 'Agent Network', 
      'TakaPay': countAgentTakaPayTotal > 0 ? Math.round((countAgentTakaPayPositive / countAgentTakaPayTotal) * 100) : 0, 
      'NgoodPay': countAgentNgoodPayTotal > 0 ? Math.round((countAgentNgoodPayPositive / countAgentNgoodPayTotal) * 100) : 0,
      takaPayPos: countAgentTakaPayPositive,
      takaPayTotal: countAgentTakaPayTotal,
      ngoodPayPos: countAgentNgoodPayPositive,
      ngoodPayTotal: countAgentNgoodPayTotal
    },
    { 
      name: 'App Speed', 
      'TakaPay': countSpeedTakaPayTotal > 0 ? Math.round((countSpeedTakaPayPositive / countSpeedTakaPayTotal) * 100) : 0, 
      'NgoodPay': countSpeedNgoodPayTotal > 0 ? Math.round((countSpeedNgoodPayPositive / countSpeedNgoodPayTotal) * 100) : 0,
      takaPayPos: countSpeedTakaPayPositive,
      takaPayTotal: countSpeedTakaPayTotal,
      ngoodPayPos: countSpeedNgoodPayPositive,
      ngoodPayTotal: countSpeedNgoodPayTotal
    }
  ];

  // 9. Fire Feed (Top 4 critical crisis posts)
  const viralCrisisFeed = [...relevantRecords]
    .filter(r => r.sentiment === 'negative')
    .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
    .slice(0, 4);

  // 10. Competitor simple metrics
  const competitorPosts = filteredRecordsAnalytics.filter(r => r.is_competitor_comparison);
  const totalCompetitorMentions = competitorPosts.length;
  const countNgoodPayPositive = competitorPosts.filter(r => {
    if (r.competitor_sentiment !== undefined && r.competitor_sentiment !== null) {
      return r.competitor_sentiment === 'positive';
    }
    const textLower = r.text.toLowerCase();
    const transLower = (r.english_translation || '').toLowerCase();
    const hasPositiveWord = textLower.includes('valo') || textLower.includes('bhala') || transLower.includes('good') || transLower.includes('great') || transLower.includes('fast') || transLower.includes('smooth') || transLower.includes('awesome') || transLower.includes('impressed') || transLower.includes('better') || transLower.includes('best') || transLower.includes('praise');
    const hasNegativeWord = textLower.includes('kharap') || textLower.includes('pending') || transLower.includes('bad') || transLower.includes('slow') || transLower.includes('worst') || transLower.includes('charge') || transLower.includes('robbery') || transLower.includes('fee');
    return hasPositiveWord && !hasNegativeWord;
  }).length;
  const countTakaPayPositive = competitorPosts.filter(r => r.sentiment === 'positive').length;

  const competitorPostsWithNgood = competitorPosts.filter(r => r.text.toLowerCase().includes('ngoodpay'));
  const competitorPostsWithTaka = competitorPosts.filter(r => {
    const textLower = r.text.toLowerCase();
    return textLower.includes('takapay') || r.brand_mention === true || r.brand_mention === 'true' || !textLower.includes('ngoodpay');
  });

  const totalNgoodPayMentions = competitorPostsWithNgood.length;
  const totalTakaPayMentions = competitorPostsWithTaka.length;

  const ngoodPayFavorabilityRate = totalNgoodPayMentions > 0
    ? Math.round((countNgoodPayPositive / totalNgoodPayMentions) * 100)
    : 0;

  const takaPayFavorabilityRate = totalTakaPayMentions > 0
    ? Math.round((countTakaPayPositive / totalTakaPayMentions) * 100)
    : 0;

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 w-full">
      {/* Hidden Input File Trigger (Always at the top level so it is accessible from any component context) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json,.csv"
        className="hidden" 
      />

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
        </div>

        {/* Global Dataset Status - Made Clickable to Re-upload files at any time */}
        {cleanedRecords.length > 0 && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group text-left"
              title="Click to upload a different file"
            >
              <Database className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  Active File <RefreshCw className="w-2.5 h-2.5 text-indigo-400 animate-hover group-hover:rotate-180 transition-transform" />
                </span>
                <span className="text-xs font-bold text-white max-w-[150px] truncate">{fileName} ({cleanedRecords.length} rows)</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to remove the active dataset? This will clear the dashboard state.")) {
                  setFileData(null);
                  setCleanedRecords([]);
                  setFileName("");
                  setFileType("");
                  setRawRecordsCount(0);
                  setDeduplicatedCount(0);
                  setProcessingMetrics(null);
                  setStatusLogs([]);
                  setFinalTime(null);
                  setProgress(0);
                  localStorage.clear();
                }
              }}
              className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
              title="Remove File and Reset App"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-white/5 pb-0.5 gap-2">
        <button 
          onClick={() => setActiveTab("analytics")}
          style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}
          className={`tab-btn flex-shrink-0 justify-center px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'analytics' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Executive Dashboard
        </button>

        {cleanedRecords.length > 0 && (
          <button 
            onClick={() => setActiveTab("explorer")}
            style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}
            className={`tab-btn flex-shrink-0 justify-center px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'explorer' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-gray-400 hover:text-white'
          }`}
          >
            <Table className="w-4 h-4" />
            Data Explorer
          </button>
        )}

        <button 
          onClick={() => setActiveTab("pipeline")}
          style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}
          className={`tab-btn flex-shrink-0 justify-center px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pipeline' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Data Cleaner {isProcessing && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
        </button>
      </div>

      {/* Global Interactive Filters Selector */}
      {cleanedRecords.length > 0 && activeTab === 'analytics' && (
        <section className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              Filters:
            </span>
          </div>

          {/* Social Media Platform Filter */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <select 
              value={analyticsPlatformFilter} 
              onChange={(e) => { setAnalyticsPlatformFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-2.5 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
            >
              <option value="all">All Social Medias</option>
              <option value="Facebook">Facebook</option>
              <option value="Reddit">Reddit</option>
              <option value="Twitter">Twitter/X</option>
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="News/Media">News & Media</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <select 
              value={analyticsSentimentFilter} 
              onChange={(e) => { setAnalyticsSentimentFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-2.5 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <select 
              value={analyticsTopicFilter} 
              onChange={(e) => { setAnalyticsTopicFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-2.5 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
            >
              <option value="all">All Topics</option>
              <option value="failed_transaction">Failed Transactions</option>
              <option value="bill_payment">Bill Payments</option>
              <option value="recharge">Mobile Recharges</option>
              <option value="send_money">Send Money</option>
              <option value="customer_care">Customer Care</option>
              <option value="charges_fees">Charges & Fees</option>
              <option value="agent_network">Agent Network</option>
              <option value="off_topic">Off-Topic</option>
            </select>
          </div>

          {/* Date Timeline Picker */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <div className="flex items-center gap-1 text-[11px]">
              <input 
                type="date" 
                value={analyticsStartDateFilter}
                min="2026-06-01"
                max="2026-06-30"
                onChange={(e) => { setAnalyticsStartDateFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
              />
              <span className="text-gray-500">to</span>
              <input 
                type="date" 
                value={analyticsEndDateFilter}
                min="2026-06-01"
                max="2026-06-30"
                onChange={(e) => { setAnalyticsEndDateFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
              />
            </div>
          </div>

          {/* Analytics-Only Search Bar */}
          <div className="relative flex items-center min-w-[200px]">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search analytics..." 
              value={analyticsSearchTerm}
              onChange={(e) => setAnalyticsSearchTerm(e.target.value)}
              className="glass-input pl-9 pr-3 py-1.5 text-xs rounded-lg w-full focus:outline-none"
            />
          </div>

          {/* Reset Filters Quick Button */}
          {(analyticsPlatformFilter !== 'all' || analyticsSentimentFilter !== 'all' || analyticsTopicFilter !== 'all' || analyticsStartDateFilter !== '2026-06-01' || analyticsEndDateFilter !== '2026-06-30' || analyticsSearchTerm !== '') && (
            <button 
              onClick={() => {
                setAnalyticsPlatformFilter('all');
                setAnalyticsSentimentFilter('all');
                setAnalyticsTopicFilter('all');
                setAnalyticsStartDateFilter('2026-06-01');
                setAnalyticsEndDateFilter('2026-06-30');
                setAnalyticsSearchTerm('');
                setCurrentPage(1);
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          )}
        </section>
      )}

      {/* --- TAB CONTENT AREA --- */}

      {/* TAB 1: EXECUTIVE ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        cleanedRecords.length === 0 ? (
          /* NO DATA STATE / WELCOME LANDING PAGE */
          <div className="flex flex-col gap-6 py-10 w-full items-center">
            <div className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center text-center border-indigo-500/10 bg-gradient-to-b from-indigo-950/10 to-transparent max-w-4xl w-full">
              <span className="p-3 bg-indigo-500/10 rounded-full text-indigo-400 mb-4 border border-indigo-500/20">
                <Sparkles className="w-10 h-10" />
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome to TakaPay Media Analyzer</h2>
              <p className="text-xs text-gray-400 mt-2 max-w-lg leading-relaxed">
                This analytics tool processes multilingual Banglish datasets, cleans sentiment contradictions, translates text, and builds visual dashboards.
              </p>

              {/* Upload Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                {/* Option 1: Load pre-cleaned */}
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="glass-panel p-6 rounded-2xl border border-dashed border-white/5 hover:border-indigo-500/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.01] transition-all"
                >
                  <Database className="w-7 h-7 text-indigo-400 mb-2" />
                  <h4 className="text-sm font-bold text-white">Load Pre-Cleaned Dataset</h4>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
                    Drop `takapay_sample_data_cleaned.json` or `.csv` to launch the dashboard instantly.
                  </p>
                </div>

                {/* Option 2: Preprocess raw */}
                <div 
                  onClick={() => { setActiveTab("pipeline"); fileInputRef.current.click(); }}
                  className="glass-panel p-6 rounded-2xl border border-dashed border-white/5 hover:border-purple-500/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.01] transition-all"
                >
                  <Sparkle className="w-7 h-7 text-purple-400 mb-2" />
                  <h4 className="text-sm font-bold text-white">Clean & Analyze Raw Data</h4>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
                    Drop raw feed data to run the LLM-powered translation and sentiment correction pipeline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE ANALYTICS DASHBOARD */
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

            {/* Charts Row 1: Donut & Stacked Bar Chart */}
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
                      <Legend content={renderCustomLegend} />
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
                      <Legend content={renderCustomLegend} />
                      <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
                      <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="Neutral" />
                      <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Charts Row 2: Competitor Battleground & Platform Negativity Density */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* TakaPay vs NgoodPay Grouped Bar Chart */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[350px]">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                    TakaPay vs. NgoodPay (Competitive Comparison)
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/10 font-bold uppercase">NgoodPay</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mb-2">
                    Visualizing comparative brand satisfaction (% positive sentiment) for posts mentioning each category.
                  </p>
                  
                  {totalCompetitorMentions > 0 && (
                    <div className="mb-4 p-2.5 rounded-xl border flex flex-col gap-1 text-[10px] bg-white/[0.01] border-white/5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400 font-semibold">Comparative Advocacy Rate:</span>
                        <div className="flex gap-2">
                          <span className="text-indigo-400 font-bold">TakaPay: {takaPayFavorabilityRate}%</span>
                          <span className="text-purple-400 font-bold">NgoodPay: {ngoodPayFavorabilityRate}%</span>
                        </div>
                      </div>
                      
                      {ngoodPayFavorabilityRate > takaPayFavorabilityRate ? (
                        <div className="mt-1 flex items-center gap-1.5 text-rose-400 font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
                          <span>⚠️ Alert: Competitor has higher brand satisfaction in comparisons!</span>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>✓ Dominance: TakaPay maintains higher customer favorability!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={competitorComparisonData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                      <YAxis stroke="#9ca3af" fontSize={9} />
                      <Tooltip 
                        contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px' }}
                        formatter={(value, name, props) => {
                          const { payload } = props;
                          let pos = 0;
                          let total = 0;
                          if (name === 'TakaPay') {
                            pos = payload.takaPayPos;
                            total = payload.takaPayTotal;
                          } else {
                            pos = payload.ngoodPayPos;
                            total = payload.ngoodPayTotal;
                          }
                          return [`${value}% (${pos} of ${total} posts)`, name];
                        }}
                      />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="TakaPay" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="NgoodPay" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Platform Sentiment Breakdown Chart */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[350px]">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Social Channel Sentiment Breakdown (% Sentiment)
                  </h3>
                  <p className="text-[10px] text-gray-400 mb-4">
                    Visualizing the proportion of Positive, Neutral, and Negative user sentiments across each social channel.
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={platformSentimentData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                      <YAxis stroke="#9ca3af" fontSize={9} unit="%" />
                      <Tooltip 
                        contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px' }}
                        formatter={(value, name, props) => {
                          const { payload } = props;
                          let count = 0;
                          if (name === 'Positive') count = payload.positiveCount;
                          else if (name === 'Neutral') count = payload.neutralCount;
                          else if (name === 'Negative') count = payload.negativeCount;
                          return [`${value}% (${count} of ${payload.totalCount} posts)`, name];
                        }}
                      />
                      <Legend content={renderCustomLegend} />
                      <Bar dataKey="Positive" fill="#10b981" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Neutral" fill="#6b7280" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Negative" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </section>

            {/* Third Row: Crisis Fire Feed */}
            <section className="grid grid-cols-1 gap-6">
              {/* Crisis Fire Feed */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[200px]">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-400 mb-4 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                    Viral Crisis Feed (High Engagement Failures)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viralCrisisFeed.map((post, index) => (
                      <div key={`${post.id}-${index}`} className="p-3.5 bg-rose-950/15 border border-rose-500/10 rounded-xl flex items-start gap-3 hover:bg-rose-950/25 transition-colors">
                        <div className="flex flex-col items-center justify-center bg-rose-500/10 border border-rose-500/20 px-2 py-1.5 rounded text-center min-w-[55px]">
                          <span className="text-[9px] text-rose-400 font-extrabold uppercase leading-none">Reach</span>
                          <span className="text-sm font-extrabold text-white mt-1 leading-none">{post.engagement}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] text-gray-400">
                            <span className="font-bold text-rose-400">@{post.author} • {post.platform}</span>
                            <span className="bg-rose-500/10 text-rose-300 px-1.5 py-0.2 rounded font-semibold text-[8px] uppercase">{post.severity_level}</span>
                          </div>
                          <p className="text-xs text-white line-clamp-2">{post.text}</p>
                          {post.english_translation && post.english_translation !== post.text && (
                            <p className="text-[10px] text-indigo-300/80 italic line-clamp-1">EN: {post.english_translation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {viralCrisisFeed.length === 0 && (
                      <div className="col-span-2 text-xs text-gray-500 text-center py-6">No critical negative incidents found.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )
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
                className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
              <button 
                onClick={downloadCSV}
                className="px-3.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search comments..." 
                value={explorerSearchTerm}
                onChange={(e) => { setExplorerSearchTerm(e.target.value); setCurrentPage(1); }}
                className="glass-input pl-9 pr-3 py-1.5 text-xs rounded-lg w-full focus:outline-none"
              />
            </div>
            <select 
              value={explorerSentimentFilter} 
              onChange={(e) => { setExplorerSentimentFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
            <select 
              value={explorerTopicFilter} 
              onChange={(e) => { setExplorerTopicFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
            >
              <option value="all">All Topics</option>
              <option value="failed_transaction">Failed Transactions</option>
              <option value="bill_payment">Bill Payments</option>
              <option value="recharge">Mobile Recharges</option>
              <option value="send_money">Send Money</option>
              <option value="customer_care">Customer Care</option>
              <option value="charges_fees">Charges & Fees</option>
              <option value="agent_network">Agent Network</option>
              <option value="off_topic">Off-Topic</option>
            </select>
            <select 
              value={explorerSeverityFilter} 
              onChange={(e) => { setExplorerSeverityFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select 
              value={explorerRiskFilter} 
              onChange={(e) => { setExplorerRiskFilter(e.target.value); setCurrentPage(1); }}
              className="glass-input px-3 py-1.5 text-xs rounded-lg text-gray-300 cursor-pointer focus:outline-none"
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
                  <th className="p-3 w-28 text-center">Topic</th>
                  <th className="p-3 w-20 text-center">Severity</th>
                  <th className="p-3 w-20 text-center">Risk</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((r, index) => (
                  <tr key={`${r.id}-${index}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono">
                        {r.topic ? r.topic.replace('_', ' ') : 'N/A'}
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
                    <td colSpan="6" className="p-8 text-center text-gray-500">
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
              <span>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRecordsExplorer.length)} of {filteredRecordsExplorer.length} entries</span>
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
      {activeTab === 'pipeline' && (
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
                    <option value="openai/gpt-oss-120b">GPT OSS 120B (High Quality)</option>
                  </select>
                </div>

                {isProcessing ? (
                  <button 
                    onClick={() => {
                      isStopRequestedRef.current = true;
                      setStatusLogs(prev => [...prev, '⚠️ Cancellation request sent...']);
                    }}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-center transition-all duration-300 cursor-pointer"
                  >
                    Stop Pipeline Execution
                  </button>
                ) : (
                  <button 
                    onClick={processDataset}
                    className="glow-button w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 text-center transition-all duration-300 cursor-pointer"
                  >
                    Execute Preprocessing Pipeline
                  </button>
                )}

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
              <div ref={logContainerRef} className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-gray-300 h-[280px] overflow-y-auto flex flex-col gap-1.5">
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
