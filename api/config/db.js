import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncDocToFirestore, deleteDocFromFirestore, syncCollectionToFirestore } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

let effectiveDataDir = DATA_DIR;
try {
  if (!fs.existsSync(effectiveDataDir)) {
    fs.mkdirSync(effectiveDataDir, { recursive: true });
  }
} catch (e) {
  effectiveDataDir = path.resolve('/tmp/aicqb-data');
  try {
    if (!fs.existsSync(effectiveDataDir)) {
      fs.mkdirSync(effectiveDataDir, { recursive: true });
    }
  } catch (_) {}
}

// In-memory cache + file sync with mtime validation
const cache = {};
const cacheMtime = {};

function getFilePath(collectionName) {
  const localPath = path.join(effectiveDataDir, `${collectionName}.json`);
  if (!fs.existsSync(localPath)) {
    const bundledPath = path.join(DATA_DIR, `${collectionName}.json`);
    if (fs.existsSync(bundledPath)) {
      try {
        const content = fs.readFileSync(bundledPath, 'utf-8');
        try { fs.writeFileSync(localPath, content, 'utf-8'); } catch (_) {}
        return localPath;
      } catch (_) {
        return bundledPath;
      }
    }
  }
  return localPath;
}

function loadCollection(collectionName) {
  const filePath = getFilePath(collectionName);
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (cache[collectionName] && cacheMtime[collectionName] === stats.mtimeMs) {
        return cache[collectionName];
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      cache[collectionName] = JSON.parse(content || '[]');
      cacheMtime[collectionName] = stats.mtimeMs;
      return cache[collectionName];
    }
  } catch (err) {
    if (cache[collectionName]) return cache[collectionName];
    cache[collectionName] = [];
  }
  if (!cache[collectionName]) {
    cache[collectionName] = [];
    saveCollection(collectionName, []);
  }
  return cache[collectionName];
}

function saveCollection(collectionName, data) {
  cache[collectionName] = data;
  const filePath = getFilePath(collectionName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    try {
      const stats = fs.statSync(filePath);
      cacheMtime[collectionName] = stats.mtimeMs;
    } catch (_) {}
  } catch (err) {
    try {
      const tmpPath = path.join('/tmp', `${collectionName}.json`);
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (_) {}
  }
}

export const db = {
  getCollection(name) {
    return [...loadCollection(name)];
  },

  getDoc(name, id) {
    const list = loadCollection(name);
    return list.find(item => item.id === id || item._id === id || item.uid === id || item.candidateId === id) || null;
  },

  find(name, predicate) {
    const list = loadCollection(name);
    return list.filter(predicate);
  },

  findOne(name, predicate) {
    const list = loadCollection(name);
    return list.find(predicate) || null;
  },

  setDoc(name, id, data) {
    const list = loadCollection(name);
    const index = list.findIndex(item => item.id === id || item._id === id || item.uid === id || item.candidateId === id);
    const docData = { ...data, id: id || data.id, updatedAt: new Date().toISOString() };
    if (!docData.createdAt) {
      docData.createdAt = new Date().toISOString();
    }
    if (index >= 0) {
      list[index] = { ...list[index], ...docData };
    } else {
      list.push(docData);
    }
    saveCollection(name, list);
    // Real-time asynchronous Firebase Firestore mirror
    syncDocToFirestore(name, docData.id, docData).catch(() => {});
    return docData;
  },

  addDoc(name, data) {
    const list = loadCollection(name);
    const id = data.id || `${name}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Unique constraint validation for critical collections
    if (name === 'certificates') {
      const existingId = list.find(item => item && (item.id === id || item.certificateId === id));
      if (existingId) {
        throw new Error(`Database Constraint Violation: Certificate ID '${id}' already exists.`);
      }
      if (data.certificateNo) {
        const existingNo = list.find(item => item && (item.certificateNo === data.certificateNo || item.certificateNumber === data.certificateNo));
        if (existingNo) {
          throw new Error(`Database Constraint Violation: Certificate Number '${data.certificateNo}' already exists.`);
        }
      }
    }

    const docData = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(docData);
    saveCollection(name, list);
    // Real-time asynchronous Firebase Firestore mirror
    syncDocToFirestore(name, docData.id, docData).catch(() => {});
    return docData;
  },

  getNextSequence(sequenceName, initialVal = 1) {
    const counters = loadCollection('counters');
    let counter = counters.find(c => c && (c.id === sequenceName || c.name === sequenceName));
    if (!counter) {
      counter = { id: sequenceName, name: sequenceName, currentVal: initialVal, updatedAt: new Date().toISOString() };
      counters.push(counter);
      saveCollection('counters', counters);
      return initialVal;
    }
    counter.currentVal = Number(counter.currentVal || 0) + 1;
    counter.updatedAt = new Date().toISOString();
    saveCollection('counters', counters);
    return counter.currentVal;
  },

  getCurrentSequence(sequenceName) {
    const counters = loadCollection('counters');
    const counter = counters.find(c => c && (c.id === sequenceName || c.name === sequenceName));
    return counter ? Number(counter.currentVal || 0) : 0;
  },

  setSequence(sequenceName, val) {
    const counters = loadCollection('counters');
    let counter = counters.find(c => c && (c.id === sequenceName || c.name === sequenceName));
    if (!counter) {
      counter = { id: sequenceName, name: sequenceName, currentVal: Number(val), updatedAt: new Date().toISOString() };
      counters.push(counter);
    } else {
      counter.currentVal = Number(val);
      counter.updatedAt = new Date().toISOString();
    }
    saveCollection('counters', counters);
    return counter.currentVal;
  },

  updateDoc(name, id, updates) {
    const list = loadCollection(name);
    const index = list.findIndex(item => item.id === id || item._id === id || item.uid === id || item.candidateId === id);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveCollection(name, list);
      // Real-time asynchronous Firebase Firestore mirror
      syncDocToFirestore(name, list[index].id || id, list[index]).catch(() => {});
      return list[index];
    }
    return null;
  },

  deleteDoc(name, id) {
    const list = loadCollection(name);
    const target = list.find(item => item.id === id || item._id === id || item.uid === id || item.candidateId === id);
    const filtered = list.filter(item => item.id !== id && item._id !== id && item.uid !== id && item.candidateId !== id);
    saveCollection(name, filtered);
    // Real-time asynchronous Firebase Firestore mirror
    const targetId = target?.id || id;
    deleteDocFromFirestore(name, targetId).catch(() => {});
    return true;
  },

  async syncAllToFirestore() {
    const collections = [
      'candidates',
      'certifications',
      'certificates',
      'exams',
      'examAttempts',
      'examSchedules',
      'results',
      'payments',
      'enrollments',
      'trainingPartners',
      'memberships',
      'auditLogs',
      'systemSettings',
    ];

    const results = {};
    for (const col of collections) {
      const items = loadCollection(col);
      const res = await syncCollectionToFirestore(col, items);
      results[col] = res;
    }
    return results;
  },
};

export default db;

