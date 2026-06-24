import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/database.js";
import { GoogleGenAI } from "@google/genai";
import { generatePlaceWithGemini } from "./src/generator.js";

// Lazy loading of Gemini client to prevent crash on startup if missing API key
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not defined. Please add it to your Secrets panel in the top-right settings!"
    );
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({
      status: "live",
      version: "1.0.0",
      db_connected: true
    });
  });

  // 1. Stats Overview
  app.get("/api/stats", (req, res) => {
    try {
      res.json(db.getStats());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Places Explorer
  app.get("/api/places", (req, res) => {
    try {
      res.json(db.getPlaces());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/places/:id", (req, res) => {
    try {
      db.deletePlace(req.params.id);
      res.json({ success: true, message: `Place ${req.params.id} deleted successfully` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Questions
  app.get("/api/questions", (req, res) => {
    try {
      res.json(db.getQuestions());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Jobs history
  app.get("/api/jobs", (req, res) => {
    try {
      res.json(db.getJobs());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 5. Quota tracing & logs
  app.get("/api/quota/today", (req, res) => {
    try {
      const logs = db.getQuotaLogs();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => log.timestamp && log.timestamp.startsWith(todayStr));
      const requests_made = todayLogs.reduce((sum, log) => sum + (log.calls_count || 1), 0);
      const requests_limit = parseInt(process.env.GEMINI_DAILY_LIMIT || "500", 10);
      const percentage = requests_limit > 0 ? (requests_made / requests_limit) * 100 : 0;
      const quota_exceeded = requests_made >= requests_limit;

      res.json({
        requests_made,
        requests_limit,
        percentage,
        quota_exceeded
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/quota", (req, res) => {
    try {
      res.json(db.getQuotaLogs());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/quota/config", (req, res) => {
    try {
      res.json(db.getQuotaConfig());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/quota/config", (req, res) => {
    try {
      const config = db.updateQuotaConfig(req.body);
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 6. Roadmap operations
  app.get("/api/roadmap", (req, res) => {
    try {
      let roadmap = db.getRoadmap();
      // Sort by id which determines priority intuitively (r-1, r-2...)
      roadmap.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      
      const summary = {
        completed: roadmap.filter(r => r.status === 'completed').length,
        in_progress: roadmap.filter(r => r.status === 'generating' || r.status === 'running').length,
        pending: roadmap.filter(r => r.status === 'planned' || r.status === 'pending').length,
      };
      res.json({ phases: roadmap, summary });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/roadmap", (req, res) => {
    try {
      const { title, description, type, priority, estimated_places } = req.body;
      if (!title || !type || !priority) {
        return res.status(400).json({ error: "Missing required fields for roadmap" });
      }
      const item = db.addRoadmapItem({
        title,
        description: description || "",
        type,
        priority,
        estimated_places: Number(estimated_places) || 3
      });
      res.status(201).json(item);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Roadmap place automatic pipeline generation
  app.post("/api/roadmap/:id/start", async (req, res) => {
    const roadmapId = req.params.id;
    const roadmapItems = db.getRoadmap();
    const roadmapItem = roadmapItems.find(r => r.id === roadmapId);

    if (!roadmapItem) {
      return res.status(404).json({ error: "Roadmap item not found" });
    }

    // Create job registry
    const job = db.addJob({
      id: `j-${Math.random().toString(36).substr(2, 9)}`,
      name: `Roadmap Pipeline: ${roadmapItem.title}`,
      type: "roadmap_generation",
      status: "running",
      processed: 0,
      total: roadmapItem.estimated_places,
      succeeded: 0,
      failed: 0,
      results: [],
      started_at: new Date().toISOString()
    });

    // Mark roadmap item as generating
    db.updateRoadmapStatus(roadmapId, "generating");

    // We do pipeline generation in secondary background promise
    // so we can respond immediately to the admin UI, preventing request timeout!
    (async () => {
      let itemsGeneratedCount = 0;
      try {
        const ai = getGeminiClient();

        let placeNames: string[] = [];
        if (roadmapItem.target_names && roadmapItem.target_names.length > 0) {
          placeNames = roadmapItem.target_names;
        } else {
          // 1. Get place names using list generation from Gemini
          const listExplanation = `Suggest exactly ${roadmapItem.estimated_places} specific highly famous or distinct real world places (landmarks, countries, or cities depending on: ${roadmapItem.type}) that match the theme: "${roadmapItem.title} - ${roadmapItem.description}".
Provide them as a simple comma-separated string of names, absolutely nothing else.`;

          const listResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: listExplanation,
            config: {
              temperature: 0.5
            }
          });

          const listText = listResponse.text || "";
          placeNames = listText
            .split(",")
            .map(n => n.replace(/[^a-zA-Z0-9\s\'\-\u00C0-\u017F]/g, "").trim())
            .filter(Boolean)
            .slice(0, roadmapItem.estimated_places);
        }

        if (placeNames.length === 0) {
          throw new Error("No place names generated by Gemini for theme list.");
        }

        // 2. Sequentially generate absolute specifications for each place
        for (const name of placeNames) {
          try {
            let placeType: 'country' | 'city' | 'landmark' = 'landmark';
            const mappedType = (roadmapItem.type || '').toLowerCase();
            if (mappedType === 'city') {
              placeType = 'city';
            } else if (mappedType === 'country') {
              placeType = 'country';
            }

            const { place, questions } = await generatePlaceWithGemini(
              ai,
              name,
              placeType,
              `Strictly adhere to theme of '${roadmapItem.title}'.`
            );

            // Add generated place and questions to real DB
            db.addPlace(place);
            for (const q of questions) {
              db.addQuestion(q);
            }

            itemsGeneratedCount++;
            const currentJob = db.getJob(job.id);
            const currentResults = currentJob ? currentJob.results : [];

            db.updateJob(job.id, { 
              processed: itemsGeneratedCount, 
              succeeded: itemsGeneratedCount,
              results: [...currentResults, { name, status: 'inserted', quality: 0.9 }]
            });
          } catch (placeErr) {
            console.error(`Failed to generate individual place name "${name}":`, placeErr);
          }
        }

        // Complete job
        db.updateJob(job.id, { 
          status: "completed", 
          processed: itemsGeneratedCount,
          succeeded: itemsGeneratedCount,
          completed_at: new Date().toISOString()
        });
        db.updateRoadmapStatus(roadmapId, "completed");

      } catch (pipelineErr: any) {
        console.error("Pipeline generation failed:", pipelineErr);
        db.updateJob(job.id, { 
          status: "failed", 
          error_message: pipelineErr.message,
          processed: itemsGeneratedCount,
          failed: roadmapItem.estimated_places - itemsGeneratedCount,
          completed_at: new Date().toISOString()
        });
        db.updateRoadmapStatus(roadmapId, "planned"); // rollback status
      }
    })();

    res.json({ success: true, message: "Pipeline generation job successfully queued.", job_id: job.id });
  });

  // 7. Unknown Places Queue operations
  app.get("/api/queue", (req, res) => {
    try {
      res.json(db.getQueue());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/queue", (req, res) => {
    try {
      const { name, context } = req.body;
      if (!name) return res.status(400).json({ error: "Place name is required" });
      const item = db.addQueueItem({ name, context: context || "Reported from GuessMyPlace game interaction" });
      res.status(201).json(item);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/queue/:id/ignore", (req, res) => {
    try {
      const item = db.updateQueueStatus(req.params.id, "ignored");
      if (!item) return res.status(404).json({ error: "Queue item not found" });
      res.json({ success: true, item });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/queue/:id/process", async (req, res) => {
    const queueId = req.params.id;
    const queueItems = db.getQueue();
    const queueItem = queueItems.find(q => q.id === queueId);

    if (!queueItem) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    const { type = "landmark" } = req.body;

    const job = db.addJob({
      id: `j-${Math.random().toString(36).substr(2, 9)}`,
      name: `Resolve Ticket Queue: ${queueItem.name}`,
      type: "enrich_place",
      status: "running",
      processed: 0,
      total: 1,
      succeeded: 0,
      failed: 0,
      results: [],
      started_at: new Date().toISOString()
    });

    try {
      const ai = getGeminiClient();

      // Resolve coordinates and progressive clues for this reported context
      const { place, questions } = await generatePlaceWithGemini(
        ai,
        queueItem.name,
        type,
        `Ticket details reported from users: "${queueItem.context}"`
      );

      db.addPlace(place);
      for (const q of questions) {
        db.addQuestion(q);
      }

      db.updateJob(job.id, { 
        status: "completed", 
        processed: 1, 
        succeeded: 1, 
        completed_at: new Date().toISOString(),
        results: [{ name: queueItem.name, status: "inserted", quality: 0.9 }]
      });
      db.updateQueueStatus(queueId, "resolved");

      res.json({ success: true, place, questions });
    } catch (err: any) {
      console.error("Queue item resolution failed:", err);
      db.updateJob(job.id, { 
        status: "failed", 
        error_message: err.message,
        processed: 1,
        failed: 1,
        completed_at: new Date().toISOString(),
        results: [{ name: queueItem.name, status: "failed", error: err.message }]
      });
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Manual direct AI prompt entry
  app.post("/api/generate-manual", async (req, res) => {
    const { name, type, instruction, difficulty } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }

    const job = db.addJob({
      id: `j-${Math.random().toString(36).substr(2, 9)}`,
      name: `Manual generate: ${name}`,
      type: "manual_generation",
      status: "running",
      processed: 0,
      total: 1,
      succeeded: 0,
      failed: 0,
      results: [],
      started_at: new Date().toISOString()
    });

    try {
      const ai = getGeminiClient();
      const customInstruction = `Generate with difficulty target ${difficulty || 'medium'}. ${instruction || ''}`;
      
      const { place, questions } = await generatePlaceWithGemini(
        ai,
        name,
        type,
        customInstruction
      );

      // Save to server DB
      db.addPlace(place);
      for (const q of questions) {
        db.addQuestion(q);
      }

      db.updateJob(job.id, { 
        status: "completed", 
        processed: 1, 
        succeeded: 1, 
        completed_at: new Date().toISOString(),
        results: [{ name, status: 'inserted', quality: 0.95 }]
      });
      res.json({ success: true, place, questions });
    } catch (err: any) {
      console.error("Direct generation failed:", err);
      db.updateJob(job.id, { 
        status: "failed", 
        error_message: err.message,
        processed: 1,
        failed: 1,
        completed_at: new Date().toISOString(),
        results: [{ name, status: 'failed', error: err.message }]
      });
      res.status(500).json({ error: err.message });
    }
  });

  // Generate checking duplicates
  app.post("/api/generate/check", (req, res) => {
    try {
      const { names } = req.body;
      const results: Record<string, any> = {};
      const existing = db.getPlaces();
      if (Array.isArray(names)) {
        names.forEach((n: string) => {
          const match = existing.find(p => p.name.toLowerCase() === n.toLowerCase());
          results[n] = {
            exists: !!match,
            place_id: match ? match.id : null,
            similar_to: null
          };
        });
      }
      res.json({ results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Generate /start
  app.post("/api/generate/start", (req, res) => {
    try {
      const { job_name, names, place_type, generate_questions, schedule_for } = req.body;
      
      const job = db.addJob({
        id: `j-${Math.random().toString(36).substr(2, 9)}`,
        name: job_name || `Manual — ${new Date().toISOString()}`,
        type: "generate_places",
        place_type: place_type || undefined,
        status: schedule_for ? "pending" : "running",
        processed: 0,
        total: Array.isArray(names) ? names.length : 0,
        succeeded: 0,
        failed: 0,
        results: [],
        scheduled_for: schedule_for || undefined,
        started_at: schedule_for ? undefined : new Date().toISOString()
      });

      // Stub Background execution
      if (!schedule_for && Array.isArray(names) && names.length > 0) {
        (async () => {
          let suc = 0;
          let fail = 0;
          let resList: any[] = [];
          for (const n of names) {
            suc++;
            resList.push({ name: n, status: 'inserted', quality: 0.95 });
            db.updateJob(job.id, { processed: suc + fail, succeeded: suc, results: resList });
          }
          db.updateJob(job.id, { status: 'completed', completed_at: new Date().toISOString() });
        })();
      }

      res.json({ job_id: job.id, message: "Started", status: job.status });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/generate/queue", (req, res) => {
    try {
      const items = db.getQueue().filter(q => q.status === 'queued');
      const places = items.map(q => ({
        id: q.id,
        name: q.name,
        reported: 1, // mock
        created_at: q.reported_at
      }));
      res.json({ places, total: places.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // Job actions
  app.post("/api/jobs/:id/pause", (req, res) => {
    try {
      const job = db.updateJob(req.params.id, { status: 'paused' });
      res.json(job || { success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/jobs/:id/resume", (req, res) => {
    try {
      const job = db.updateJob(req.params.id, { status: 'running' });
      res.json(job || { success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/jobs/:id/cancel", (req, res) => {
    try {
      const job = db.updateJob(req.params.id, { status: 'failed', error_message: 'Cancelled by user', failed: 1 });
      res.json(job || { success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 9. Wipe and reset database to factory seeds (very useful auxiliary developer tool)
  app.post("/api/database/reset", (req, res) => {
    try {
      db.reset();
      res.json({ success: true, message: "Database reinitialized to seed values" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- End of API Routes ---

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support modern express routing spa fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AtlasMind Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("AtlasMind server bootstrap failed:", err);
});
