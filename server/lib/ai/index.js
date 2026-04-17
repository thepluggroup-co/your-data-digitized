/**
 * lib/ai/index.js
 * Point d'entrée unique — exporte toutes les fonctions IA du projet.
 *
 * Usage :
 *   const AI = require('./lib/ai');
 *   const reply = await AI.sendMessage("Bonjour");
 *   const report = await AI.generateReport('situation-client', data);
 *   const score = await AI.scoreDossier(dossierData);
 */

const { sendMessage }                          = require("./assistant");
const { addMessage, buildMessages,
        truncateHistory, createHistory }       = require("./conversation");
const { analyzePDF, analyzeExcel }             = require("./document-analyzer");
const { fileToBase64, detectFileType,
        readExcelAsText }                      = require("./file-utils");
const { generateReport, generateClientSituation,
        generateBankNote, generateMonthlyDashboard } = require("./report-generator");
const { markdownToPlainText, generateReportFilename,
        addReportHeader }                      = require("./report-formatter");
const { scoreDossier, detectAnomalies,
        generateRecommendations }              = require("./risk-analyzer");
const { runDailyAnalysis, checkEcheances,
        buildAlertsSummary }                  = require("./alerts-engine");
const { initScheduler, triggerDailyAnalysis } = require("./scheduler");
const { getClient, DEFAULT_MODEL, TOKEN_LIMITS } = require("./client");

module.exports = {
  // Client
  getClient, DEFAULT_MODEL, TOKEN_LIMITS,

  // Assistant & Conversation
  sendMessage,
  addMessage, buildMessages, truncateHistory, createHistory,

  // Document Analysis
  analyzePDF, analyzeExcel,
  fileToBase64, detectFileType, readExcelAsText,

  // Report Generation
  generateReport, generateClientSituation, generateBankNote, generateMonthlyDashboard,
  markdownToPlainText, generateReportFilename, addReportHeader,

  // Risk & Alerts
  scoreDossier, detectAnomalies, generateRecommendations,
  runDailyAnalysis, checkEcheances, buildAlertsSummary,

  // Scheduler
  initScheduler, triggerDailyAnalysis,
};
