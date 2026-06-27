const Task = require("../models/Task");
const Project = require("../models/Project");
const asyncWrap = require("../utils/asyncWrap");
const { analyzeTasks } = require("../services/ai.service");

exports.getAnalytics = asyncWrap(async (req, res) => {

  // 🔹 USER PERFORMANCE
  const userPerformance = await Task.aggregate([
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] }
        }
      }
    }
  ]);

  // 🔹 PROJECT COMPLETION
  const projectStats = await Task.aggregate([
    {
      $group: {
        _id: "$project",
        total: { $sum: 1 },
        done: {
          $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] }
        }
      }
    }
  ]);

  // 🔹 FETCH LIMITED TASKS FOR AI
  const tasks = await Task.find()
    .select("title status priority createdAt updatedAt")
    .limit(50);

  const aiInsights = await analyzeTasks(tasks);

  res.json({
    success: true,
    userPerformance,
    projectStats,
    aiInsights
  });
});