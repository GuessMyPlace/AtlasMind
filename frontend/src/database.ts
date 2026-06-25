import fs from 'fs';
import path from 'path';
import { 
  Place, 
  Question, 
  AtlasMindJob, 
  GeminiQuotaLog, 
  AtlasMindRoadmap, 
  UnknownPlacesQueue, 
  QuotaConfig 
} from './types.js';

const DB_FILE_PATH = path.join(process.cwd(), 'data_db.json');

interface Schema {
  places: Place[];
  questions: Question[];
  jobs: AtlasMindJob[];
  quota_logs: GeminiQuotaLog[];
  roadmap: AtlasMindRoadmap[];
  queue: UnknownPlacesQueue[];
  quota_config: QuotaConfig;
}

const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
  maxDailyTokens: 500000,
  maxTokensPerMinute: 40000,
  simulateQuotaLimit: false,
  artificialErrorRate: 0,
  monthlyBudgetUSD: 100
};

// Initial realistic seed data for high fidelity initialization
const SEED_PLACES: Place[] = [
  {
    id: 'p-1',
    name: 'Eiffel Tower',
    type: 'landmark',
    latitude: 48.8584,
    longitude: 2.2945,
    country: 'France',
    city: 'Paris',
    description: 'The iconic 19th-century iron lattice tower designed by Gustave Eiffel for the 1889 Exposition Universelle.',
    difficulty: 'easy',
    tags: ['historic', 'tower', 'engineering', 'romantic'],
    clues: [
      'It is nicknamed "La dame de fer" (The Iron Lady) and dominates the skyline of its romantic host city.',
      'Constructed as the main entrance arch for the 1889 World\'s Fair.',
      'The tower changes its height by up to 15 cm depending on thermal expansion of the steel.',
      'Designed by the same structural engineer who created the internal framework of the Statue of Liberty.'
    ],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p-2',
    name: 'Kyoto',
    type: 'city',
    latitude: 35.0116,
    longitude: 135.7681,
    country: 'Japan',
    city: 'Kyoto',
    description: 'The cultural heart of its country, famous for thousands of classical Buddhist temples, gardens, imperial palaces, Shinto shrines, and traditional wooden houses.',
    difficulty: 'medium',
    tags: ['temples', 'culture', 'heritage', 'cherry-blossom'],
    clues: [
      'It was the historic imperial capital of its island nation for over a thousand years before power shifted east.',
      'Home to the famous Fushimi Inari-taisha, featuring thousands of vibrant vermilion torii gates.',
      'Renowned for its meticulously preserved historic Gion district, where traditional tea houses flourish.',
      'It escaped major bombing during World War II due to its immense cultural wealth, personal intervention of the US Secretary of War.'
    ],
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p-3',
    name: 'Machu Picchu',
    type: 'landmark',
    latitude: -13.1631,
    longitude: -72.5450,
    country: 'Peru',
    city: 'Aguas Calientes',
    description: 'An ancient Incan citadel set high in the Andes Mountains in Peru, built in the 15th century and later abandoned.',
    difficulty: 'easy',
    tags: ['archaeology', 'mountain', 'ruins', 'ancient'],
    clues: [
      'This celestial citadel resides high in the Andes, perched on a narrow ridge overlooking a roaring river.',
      'Constructed at the height of the Inca Empire under Emperor Pachacuti around 1450 AD.',
      'Its stone construction uses "ashlar" masonry—precisely cut stones fitted together tightly without any mortar.',
      'Often called "The Lost City of the Incas", it remained hidden from the Spanish conquistadors and was brought to global attention in 1911.'
    ],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p-4',
    name: 'Reykjavik',
    type: 'city',
    latitude: 64.1466,
    longitude: -21.9426,
    country: 'Iceland',
    city: 'Reykjavik',
    description: 'The coastal capital of a unique Nordic volcanic island nation, running largely on geothermal energy.',
    difficulty: 'hard',
    tags: ['nordic', 'coastal', 'geothermal', 'northern-lights'],
    clues: [
      'The northernmost national capital of a sovereign state in the entire world.',
      'Its name literally translates to "Smoky Bay" in Old Norse, inspired by the rising steam from nearby hot springs.',
      'The city is dominated by the majestic, expressionist Hallgrímskirkja church, designed to mimic cooling basalt lava flows.',
      'It lies just south of the Arctic Circle, receiving only about four hours of sunlight in winter but offering midnight sun in the summer.'
    ],
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  }
];

const SEED_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    place_id: 'p-1',
    text: 'What was the original intended event for which the Eiffel Tower was built?',
    options: ['The 1889 World\'s Fair', 'The 1900 Summer Olympics', 'The Centennial of the French Republic', 'The Signing of the Treaty of Paris'],
    correct_answer: 'The 1889 World\'s Fair',
    explanation: 'Gustave Eiffel built this colossal iron structure as the main entrance arch for the 1889 Exposition Universelle to celebrate the centennial of the French Revolution.'
  },
  {
    id: 'q-2',
    place_id: 'p-1',
    text: 'What structural feature allows the Eiffel Tower to handle summer heat expansions?',
    options: ['Thermal joint slides that let the metal expand without bending', 'It physically grows taller by up to 15 cm in the sun', 'A custom water circulation system that constantly cools the base', 'Magnetic foundations that shift under local tectonic pressures'],
    correct_answer: 'It physically grows taller by up to 15 cm in the sun',
    explanation: 'Thermal expansion causes the iron metal structure to expand under direct hot sunlight, making the tower grow up to 15 cm (6 inches) taller and tilt slightly away from the sun.'
  },
  {
    id: 'q-3',
    place_id: 'p-2',
    text: 'For how many centuries did Kyoto serve as the imperial capital of Japan?',
    options: ['3 centuries', '5 centuries', 'Over 10 centuries', ' Kyoto was never the formal capital'],
    correct_answer: 'Over 10 centuries',
    explanation: 'Kyoto (originally called Heian-kyo) served as the imperial capital of Japan from 794 AD until the Meiji Restoration in 1869 when the capital moved to Tokyo.'
  },
  {
    id: 'q-4',
    place_id: 'p-3',
    text: 'Which archaeological explorer brought the ruins of Machu Picchu to international prominence in 1911?',
    options: ['Hiram Bingham', 'Howard Carter', 'Heinrich Schliemann', 'Arthur Evans'],
    correct_answer: 'Hiram Bingham',
    explanation: 'American academic and explorer Hiram Bingham rediscovered the ruins of Machu Picchu in 1911 with the guidance of local Peruvian farmers.'
  },
  {
    id: 'q-5',
    place_id: 'p-4',
    text: 'What does the name of the capital city "Reykjavik" translate to in English?',
    options: ['Smoky Bay', 'White Harbor', 'Frozen River', 'Nordic Crown'],
    correct_answer: 'Smoky Bay',
    explanation: 'It translates to "Smoky Bay" or "Steam Bay" in Old Norse, which was named by the first settler Ingólfur Arnarson in reference to the steaming geothermal vents.'
  }
];

const SEED_ROADMAP: AtlasMindRoadmap[] = [
  {
    id: 'r-1',
    title: 'Phase A — Bangladesh: Dhaka Division',
    description: 'Cities, landmarks, and historic sites across the Dhaka Division.',
    type: 'Mixed',
    priority: 'Priority 1',
    status: 'completed',
    estimated_places: 24,
    target_names: ['Dhaka', 'Narayanganj', 'Gazipur', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail', 'Faridpur', 'Rajbari', 'Gopalganj', 'Madaripur', 'Shariatpur', 'Parliament House', 'Shaheed Minar', 'Lalbagh Fort', 'Ahsan Manzil', 'Liberation War Museum', 'National Museum', 'Bangabandhu Museum', 'Baitul Mukarram Mosque', 'Dhaka University', 'Hatirjheel Lake', 'Star Mosque', 'Baldha Garden', 'Paharpur Buddhist Monastery', 'Mahasthangarh', 'Sonargaon', 'Mainamati Ruins', 'Wari-Bateshwar'],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-2',
    title: 'Phase B — Bangladesh: Chittagong Division',
    description: 'Cities, natural sites, and landmarks in the Chittagong Division.',
    type: 'Mixed',
    priority: 'Priority 2',
    status: 'generating',
    estimated_places: 15,
    target_names: ['Chittagong', 'Cox\'s Bazar', 'Rangamati', 'Bandarban', 'Khagrachhari', 'Feni', 'Comilla', 'Brahmanbaria', 'Noakhali', 'Lakshmipur', 'Chandpur', 'Cox\'s Bazar Beach', 'Saint Martin\'s Island', 'Kaptai Lake', 'Nafakhum Waterfall', 'Boga Lake', 'Nilgiri Hills', 'Chimbuk Hill', 'Hinchhari Waterfall', 'Inani Beach', 'Teknaf Wildlife Sanctuary', 'Chittagong Port', 'Foys Lake', 'Patenga Beach', 'War Cemetery Comilla'],
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-3',
    title: 'Phase C — Bangladesh: All Other Divisions',
    description: 'Sylhet, Rajshahi, Khulna, Barisal, Mymensingh, Rangpur',
    type: 'Mixed',
    priority: 'Priority 3',
    status: 'planned',
    estimated_places: 40,
    target_names: ['Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Mymensingh', 'Rangpur', 'Bogra', 'Pabna', 'Dinajpur', 'Kuakata'],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-4',
    title: 'Phase D — Bangladesh: Natural Geography',
    description: 'Rivers, forests, and haors across Bangladesh.',
    type: 'Natural',
    priority: 'Priority 4',
    status: 'planned',
    estimated_places: 15,
    target_names: ['Padma', 'Meghna', 'Jamuna', 'Surma', 'Karnaphuli', 'Brahmaputra', 'Teesta', 'Buriganga', 'Halda', 'Sundarbans', 'Modhupur', 'Hakaluki Haor', 'Tanguar Haor', 'Baikka Beel', 'Char Kukri Mukri'],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-5',
    title: 'Phase E — Bangladesh: Heritage + Liberation War',
    description: 'Historical sites and monuments.',
    type: 'Historical',
    priority: 'Priority 5',
    status: 'planned',
    estimated_places: 6,
    target_names: ['Mujibnagar', 'Savar National Memorial', 'March 7 Speech Site', 'Sat Gombuj Mosque', 'Kantaji Temple', 'Sixty Dome Mosque'],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-6',
    title: 'Phase F — World Cities',
    description: 'After BD complete: Asian capitals, European capitals, Top tourist cities.',
    type: 'City',
    priority: 'Priority 6',
    status: 'planned',
    estimated_places: 100,
    target_names: ['Tokyo', 'Paris', 'London', 'New York', 'Dubai', 'Singapore'],
    created_at: new Date().toISOString()
  },
  {
    id: 'r-7',
    title: 'Phase G — World Landmarks',
    description: 'UNESCO sites, Famous landmarks by continent.',
    type: 'Landmark',
    priority: 'Priority 7',
    status: 'planned',
    estimated_places: 100,
    target_names: ['Colosseum', 'Taj Mahal', 'Machu Picchu', 'Great Wall of China'],
    created_at: new Date().toISOString()
  },
  {
    id: 'r-8',
    title: 'Phase H — Natural Wonders',
    description: 'Mountains, rivers, deserts, forests worldwide.',
    type: 'Natural',
    priority: 'Priority 8',
    status: 'planned',
    estimated_places: 100,
    target_names: ['Mount Everest', 'Amazon River', 'Sahara Desert', 'Grand Canyon'],
    created_at: new Date().toISOString()
  }
];

const SEED_QUEUE: UnknownPlacesQueue[] = [
  {
    id: 'qitem-1',
    name: 'Statue of Liberty',
    context: 'User reported that the clues confuse users with the Eiffel Tower designer. Needs clear separate historical clues.',
    status: 'queued',
    reported_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 'qitem-2',
    name: 'Petra',
    context: 'Requested landmark from custom player requests in Jordan. Missing in current game database.',
    status: 'queued',
    reported_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

const SEED_JOBS: AtlasMindJob[] = [
  {
    id: 'j-1',
    name: 'Seed Initialization Places',
    type: 'generate_places',
    status: 'completed',
    processed: 4,
    total: 4,
    succeeded: 4,
    failed: 0,
    results: [
      { name: 'Eiffel Tower', status: 'inserted', quality: 0.95, questions_generated: 2 },
      { name: 'Kyoto', status: 'inserted', quality: 0.92, questions_generated: 1 },
      { name: 'Machu Picchu', status: 'inserted', quality: 0.88, questions_generated: 1 },
      { name: 'Reykjavik', status: 'inserted', quality: 0.91, questions_generated: 1 }
    ],
    started_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 4000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 4000).toISOString()
  }
];

const SEED_QUOTA_LOGS: GeminiQuotaLog[] = [
  {
    id: 'ql-1',
    tokens_used: 1240,
    calls_count: 1,
    model: 'gemini-3.5-flash',
    prompt_summary: 'Generate places: Eiffel Tower, Kyoto, Machu Picchu, Reykjavik',
    timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

export class DatabaseManager {
  private schema: Schema;

  constructor() {
    this.schema = this.load();
  }

  private load(): Schema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent) as Schema;
      }
    } catch (e) {
      console.error('Error loading DB file, fallback to initialization:', e);
    }

    // Initialize with Seed Data
    const initialSchema: Schema = {
      places: SEED_PLACES,
      questions: SEED_QUESTIONS,
      jobs: SEED_JOBS,
      quota_logs: SEED_QUOTA_LOGS,
      roadmap: SEED_ROADMAP,
      queue: SEED_QUEUE,
      quota_config: DEFAULT_QUOTA_CONFIG
    };
    this.saveToDisk(initialSchema);
    return initialSchema;
  }

  private saveToDisk(data: Schema = this.schema) {
    try {
      // Ensure directory exists
      const dirOfDb = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dirOfDb)) {
        fs.mkdirSync(dirOfDb, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing DB file to disk:', e);
    }
  }

  reset() {
    this.schema = {
      places: JSON.parse(JSON.stringify(SEED_PLACES)),
      questions: JSON.parse(JSON.stringify(SEED_QUESTIONS)),
      jobs: JSON.parse(JSON.stringify(SEED_JOBS)),
      quota_logs: JSON.parse(JSON.stringify(SEED_QUOTA_LOGS)),
      roadmap: JSON.parse(JSON.stringify(SEED_ROADMAP)),
      queue: JSON.parse(JSON.stringify(SEED_QUEUE)),
      quota_config: JSON.parse(JSON.stringify(DEFAULT_QUOTA_CONFIG))
    };
    this.saveToDisk();
  }

  // --- Real Operations ---

  getStats() {
    const places = this.schema.places;
    const questions = this.schema.questions;
    const queue = this.schema.queue;
    const roadmap = this.schema.roadmap;
    const jobs = this.schema.jobs;
    const logs = this.schema.quota_logs;

    const tourCount = places.filter(p => p.type === 'landmark').length;
    const cityCount = places.filter(p => p.type === 'city').length;
    const countryCount = places.filter(p => p.type === 'country').length;

    const totalTokensUsed = logs.reduce((acc, log) => acc + log.tokens_used, 0);

    return {
      rates: {
        landmark: tourCount,
        city: cityCount,
        country: countryCount,
        total: places.length
      },
      questions_count: questions.length,
      pending_queue_count: queue.filter(q => q.status === 'queued').length,
      roadmap_count: roadmap.length,
      jobs_count: jobs.length,
      total_tokens: totalTokensUsed,
      total_api_calls: logs.length
    };
  }

  getPlaces() {
    return this.schema.places;
  }

  addPlace(place: Omit<Place, 'created_at'>) {
    const newPlace: Place = {
      ...place,
      created_at: new Date().toISOString()
    };
    this.schema.places.unshift(newPlace);
    this.saveToDisk();
    return newPlace;
  }

  deletePlace(id: string) {
    this.schema.places = this.schema.places.filter(p => p.id !== id);
    // Also cascade cascade-delete connected questions
    this.schema.questions = this.schema.questions.filter(q => q.place_id !== id);
    this.saveToDisk();
  }

  getQuestions() {
    return this.schema.questions;
  }

  addQuestion(question: Omit<Question, 'id'>) {
    const newQuestion: Question = {
      ...question,
      id: `q-${Math.random().toString(36).substr(2, 9)}`
    };
    this.schema.questions.push(newQuestion);
    this.saveToDisk();
    return newQuestion;
  }

  getJobs() {
    return this.schema.jobs;
  }

  getJob(id: string) {
    return this.schema.jobs.find(j => j.id === id) || null;
  }

  addJob(job: Omit<AtlasMindJob, 'created_at' | 'updated_at'>) {
    const newJob: AtlasMindJob = {
      ...job,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.schema.jobs.unshift(newJob);
    this.saveToDisk();
    return newJob;
  }

  updateJob(id: string, updates: Partial<AtlasMindJob>) {
    const jobIndex = this.schema.jobs.findIndex(j => j.id === id);
    if (jobIndex !== -1) {
      this.schema.jobs[jobIndex] = {
        ...this.schema.jobs[jobIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.saveToDisk();
      return this.schema.jobs[jobIndex];
    }
    return null;
  }

  getQuotaLogs() {
    return this.schema.quota_logs;
  }

  addQuotaLog(log: Omit<GeminiQuotaLog, 'id' | 'timestamp'>) {
    const newLog: GeminiQuotaLog = {
      ...log,
      id: `ql-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    this.schema.quota_logs.unshift(newLog);
    this.saveToDisk();
    return newLog;
  }

  getRoadmap() {
    return this.schema.roadmap;
  }

  addRoadmapItem(item: Omit<AtlasMindRoadmap, 'id' | 'created_at' | 'status'>) {
    const newItem: AtlasMindRoadmap = {
      ...item,
      id: `r-${Math.random().toString(36).substr(2, 9)}`,
      status: 'planned',
      created_at: new Date().toISOString()
    };
    this.schema.roadmap.unshift(newItem);
    this.saveToDisk();
    return newItem;
  }

  updateRoadmapStatus(id: string, status: 'planned' | 'generating' | 'completed') {
    const index = this.schema.roadmap.findIndex(r => r.id === id);
    if (index !== -1) {
      this.schema.roadmap[index].status = status;
      this.saveToDisk();
      return this.schema.roadmap[index];
    }
    return null;
  }

  getQueue() {
    return this.schema.queue;
  }

  addQueueItem(item: Omit<UnknownPlacesQueue, 'id' | 'reported_at' | 'status'>) {
    const newItem: UnknownPlacesQueue = {
      ...item,
      id: `qitem-${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      reported_at: new Date().toISOString()
    };
    this.schema.queue.unshift(newItem);
    this.saveToDisk();
    return newItem;
  }

  updateQueueStatus(id: string, status: 'queued' | 'resolved' | 'ignored') {
    const index = this.schema.queue.findIndex(q => q.id === id);
    if (index !== -1) {
      this.schema.queue[index].status = status;
      this.saveToDisk();
      return this.schema.queue[index];
    }
    return null;
  }

  getQuotaConfig() {
    return this.schema.quota_config;
  }

  updateQuotaConfig(config: QuotaConfig) {
    this.schema.quota_config = config;
    this.saveToDisk();
    return this.schema.quota_config;
  }
}

export const db = new DatabaseManager();
