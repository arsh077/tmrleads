import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let serviceAccount;
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  throw new Error('Firebase service account not found: please provide firebase-service-account.json file or FIREBASE_SERVICE_ACCOUNT environment variable');
}

if (!admin.apps.length) {
  const firebaseApp = admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });
}
const db = getFirestore();

// Initialize lazy-load client or standard client
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// State interfaces
interface Employee {
  id: string;
  loginId?: string;
  password?: string;
  name: string;
  active: boolean;
  leadCount: number;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  assignedTo: string | null;
  status: 'New' | 'Contacted' | 'Closed';
  notes?: string;
  followUpDate?: string;
  timeline?: {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    notes?: string;
  }[];
  updatedAt?: string;
  createdAt: string;
}

interface AdminProfile {
  name: string;
  loginId: string;
  password: string;
}

// Helper function to get admin profile from Firestore
async function getAdminProfile(): Promise<AdminProfile> {
  const doc = await db.collection('config').doc('admin').get();
  if (doc.exists) {
    return doc.data() as AdminProfile;
  }
  const defaultAdmin: AdminProfile = {
    name: 'Admin', loginId: 'admin', password: 'admin'
  };
  await db.collection('config').doc('admin').set(defaultAdmin);
  return defaultAdmin;
}

// Helper function to sync lead counts dynamically
async function syncLeadCounts(employees: Employee[]): Promise<void> {
  const leadsSnapshot = await db.collection('leads').get();
  const leadAssignments = new Map<string, number>();
  leadsSnapshot.docs.forEach(doc => {
    const lead = doc.data() as Lead;
    if (lead.assignedTo) {
      leadAssignments.set(lead.assignedTo, (leadAssignments.get(lead.assignedTo) || 0) + 1);
    }
  });
  for (const emp of employees) {
    emp.leadCount = leadAssignments.get(emp.id) || 0;
  }
}

// API Routes
app.get('/api/state', async (req, res) => {
  const employeesSnapshot = await db.collection('employees').get();
  const employees = employeesSnapshot.docs.map(doc => doc.data() as Employee);
  await syncLeadCounts(employees);

  const leadsSnapshot = await db.collection('leads').get();
  const leads = leadsSnapshot.docs.map(doc => doc.data() as Lead);

  const adminProfile = await getAdminProfile();
  res.json({ employees, leads, adminProfile });
});

app.post('/api/employees', async (req, res) => {
  const { name, loginId, password } = req.body;
  if (!name || !loginId) return res.status(400).json({ error: 'Name and Login ID are required' });

  const adminProfile = await getAdminProfile();
  const employeesSnapshot = await db.collection('employees').where('loginId', '==', loginId).get();
  if (!employeesSnapshot.empty || loginId === adminProfile.loginId) {
    return res.status(400).json({ error: 'Login ID already exists' });
  }

  const emp: Employee = {
    id: randomUUID(),
    loginId,
    password: password || '123456',
    name,
    active: true,
    leadCount: 0
  };
  await db.collection('employees').doc(emp.id).set(emp);
  res.json(emp);
});

app.patch('/api/employees/:id', async (req, res) => {
  const empDoc = await db.collection('employees').doc(req.params.id).get();
  if (!empDoc.exists) return res.status(404).json({ error: 'Employee not found' });
  const emp = empDoc.data() as Employee;

  if (req.body.active !== undefined) {
    emp.active = req.body.active;
  }
  if (req.body.name !== undefined) {
    emp.name = req.body.name;
  }
  if (req.body.loginId !== undefined) {
    const loginIdLower = req.body.loginId.toLowerCase();
    const adminProfile = await getAdminProfile();
    const duplicateSnapshot = await db.collection('employees').where('loginId', '==', req.body.loginId).get();
    const isDuplicate = !duplicateSnapshot.empty && duplicateSnapshot.docs[0].id !== req.params.id || loginIdLower === adminProfile.loginId.toLowerCase();
    if (isDuplicate) {
      return res.status(400).json({ error: 'Login ID already exists' });
    }
    emp.loginId = req.body.loginId;
  }
  if (req.body.password !== undefined) {
    emp.password = req.body.password;
  }
  await db.collection('employees').doc(req.params.id).set(emp, { merge: true });
  res.json(emp);
});

app.patch('/api/admin/profile', async (req, res) => {
  let adminProfile = await getAdminProfile();
  const { name, loginId, password } = req.body;
  if (loginId !== undefined) {
    const loginIdLower = loginId.toLowerCase();
    const employeesSnapshot = await db.collection('employees').where('loginId', '==', loginId).get();
    if (!employeesSnapshot.empty) {
      return res.status(400).json({ error: 'Login ID already exists as an employee' });
    }
    adminProfile.loginId = loginId;
  }
  if (name !== undefined) {
    adminProfile.name = name;
  }
  if (password !== undefined) {
    adminProfile.password = password;
  }
  await db.collection('config').doc('admin').set(adminProfile);
  res.json(adminProfile);
});

app.delete('/api/employees/:id', async (req, res) => {
  await db.collection('employees').doc(req.params.id).delete();
  // Unassign leads if employee is deleted
  const leadsSnapshot = await db.collection('leads').where('assignedTo', '==', req.params.id).get();
  const batch = db.batch();
  leadsSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { assignedTo: null });
  });
  await batch.commit();
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { loginId, password } = req.body;
  const adminProfile = await getAdminProfile();
  if (loginId === adminProfile.loginId && password === adminProfile.password) {
    return res.json({ id: 'admin', role: 'admin' });
  }
  const employeesSnapshot = await db.collection('employees').where('loginId', '==', loginId).get();
  if (employeesSnapshot.empty) return res.status(401).json({ error: 'Invalid credentials' });
  const emp = employeesSnapshot.docs[0].data() as Employee;
  if (emp.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  if (!emp.active) return res.status(403).json({ error: 'Account inactive' });

  res.json({ id: emp.id, role: 'employee' });
});

app.post('/api/leads/parse-screenshots', async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one screenshot image is required.' });
    }

    const allExtractedLeads: { name: string; phone: string }[] = [];

    for (const imageStr of images) {
      // Clean base64 data
      let mimeType = 'image/png';
      let base64Data = imageStr;
      const match = imageStr.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      let parsedLeadsFromThisImage: { name: string; phone: string }[] = [];
      let successUsingNvidia = false;

      const nvidiaApiKey = process.env.NVIDIA_API_KEY || "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";
      if (nvidiaApiKey) {
        try {
          console.log('Attempting to scan screenshot using NVIDIA NIM API with google/diffusiongemma-26b-a4b-it...');
          const apiUrl = process.env.NVIDIA_API_URL || "http://0.0.0.0:8000/v1/chat/completions";
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nvidiaApiKey}`,
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "google/diffusiongemma-26b-a4b-it",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `You are an automated lead OCR scanner for Legal Success India. 
Analyze this screenshot image. Identify all potential customer contact/lead details. 
Specifically, extract any visible Names and Phone/Mobile numbers. 
Return a JSON object with a single "leads" array. Each lead must contain a "name" and a "phone" number.
Ensure to clean up the phone numbers (remove formatting characters like spaces, hyphens, brackets, but preserve country codes if relevant).
If a contact name is missing but a phone number is visible, use a descriptive placeholder like "Lead - Mobile" or similar.
If no contacts are found, return {"leads": []}.
Ensure your response is valid JSON only of the following structure:
{
  "leads": [
    { "name": "Name", "phone": "Clean phone number" }
  ]
}`
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${base64Data}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1024
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textResult = data.choices?.[0]?.message?.content;
            if (textResult) {
              let cleanText = textResult.trim();
              if (cleanText.startsWith('```json')) {
                cleanText = cleanText.substring(7);
              } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.substring(3);
              }
              if (cleanText.endsWith('```')) {
                cleanText = cleanText.substring(0, cleanText.length - 3);
              }
              const parsed = JSON.parse(cleanText.trim());
              if (parsed && Array.isArray(parsed.leads)) {
                parsedLeadsFromThisImage = parsed.leads;
                successUsingNvidia = true;
                console.log('Successfully extracted leads using NVIDIA NIM!');
              }
            }
          } else {
            console.error(`NVIDIA NIM API error: ${response.status} ${response.statusText}`);
          }
        } catch (nvidiaErr) {
          console.error('Error invoking NVIDIA NIM API:', nvidiaErr);
        }
      }

      if (successUsingNvidia) {
        allExtractedLeads.push(...parsedLeadsFromThisImage);
      } else {
        console.log('Falling back to Gemini API...');
        try {
          const ai = getAiClient();
          const imagePart = {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          };

          const textPart = {
            text: `You are an automated lead OCR scanner for Legal Success India. 
Analyze this screenshot image. Identify all potential customer contact/lead details. 
Specifically, extract any visible Names and Phone/Mobile numbers. 
Return a JSON object matching the requested schema. Ensure to clean up the phone numbers (remove formatting characters like spaces, hyphens, brackets, but preserve country codes if relevant).
If a contact name is missing but a phone number is visible, use a descriptive placeholder like "Lead - Mobile" or similar.
If no contacts are found, return an empty array.`
          };

          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  leads: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: 'Name of the lead/contact' },
                        phone: { type: Type.STRING, description: 'Clean phone number/mobile number' }
                      },
                      required: ['name', 'phone']
                    }
                  }
                },
                required: ['leads']
              }
            }
          });

          const textResult = response.text;
          if (textResult) {
            const parsed = JSON.parse(textResult.trim());
            if (parsed && Array.isArray(parsed.leads)) {
              allExtractedLeads.push(...parsed.leads);
            }
          }
        } catch (geminiErr) {
          console.error('Error invoking Gemini fallback API:', geminiErr);
        }
      }
    }

    // Filter out duplicate or completely empty ones
    const validLeads = allExtractedLeads.filter(l => l.name?.trim() || l.phone?.trim());

    // Sync counts before distributing new leads
    const employeesSnapshot = await db.collection('employees').get();
    const employees = employeesSnapshot.docs.map(doc => doc.data() as Employee);
    await syncLeadCounts(employees);

    const createdLeads: Lead[] = [];
    const batch = db.batch();

    for (const leadData of validLeads) {
      const lead: Lead = {
        id: randomUUID(),
        name: leadData.name?.trim() || 'Lead - Mobile',
        phone: leadData.phone?.trim() || '',
        assignedTo: null,
        status: 'New',
        createdAt: new Date().toISOString(),
        timeline: [{
          id: randomUUID(),
          action: 'Lead created via Screenshot OCR scan',
          user: 'System',
          timestamp: new Date().toISOString()
        }]
      };

      // Distribution logic: distribute across all employees (even if offline/inactive)
      if (employees.length > 0) {
        const sortedEmployees = [...employees].sort((a, b) => a.leadCount - b.leadCount);
        const assignee = sortedEmployees[0];
        lead.assignedTo = assignee.id;
        assignee.leadCount++;
        lead.timeline.push({
          id: randomUUID(),
          action: `Auto-distributed to ${assignee.name} (Allocated offline)`,
          user: 'System',
          timestamp: new Date().toISOString()
        });
      }

      createdLeads.push(lead);
      batch.set(db.collection('leads').doc(lead.id), lead);
    }

    await batch.commit();

    res.json({
      success: true,
      extractedCount: validLeads.length,
      createdCount: createdLeads.length,
      leads: createdLeads
    });

  } catch (error: any) {
    console.error('Error in parse-screenshots endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to parse screenshots.' });
  }
});

app.post('/api/leads/bulk', async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText is required' });
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

  // Sync counts before distributing new leads
  const employeesSnapshot = await db.collection('employees').get();
  const employees = employeesSnapshot.docs.map(doc => doc.data() as Employee);
  await syncLeadCounts(employees);

  const newLeads: Lead[] = [];
  const batch = db.batch();

  for (const line of lines) {
    // Basic heuristic to extract phone from the end of the line
    // e.g. "John Doe 9876543210" or "Alice 123-456-7890"
    const parts = line.split(' ');
    let phone = '';
    let name = '';

    if (parts.length > 1) {
      // Assume last part is phone if it contains digits
      const lastPart = parts[parts.length - 1];
      if (/\d/.test(lastPart)) {
        phone = lastPart;
        name = parts.slice(0, -1).join(' ');
      } else {
        name = line;
      }
    } else {
      name = line;
    }

    const lead: Lead = {
      id: randomUUID(),
      name,
      phone,
      assignedTo: null,
      status: 'New',
      createdAt: new Date().toISOString(),
      timeline: [{
        id: randomUUID(),
        action: 'Lead created via bulk raw text upload',
        user: 'Admin',
        timestamp: new Date().toISOString()
      }]
    };

    // Distribution logic: distribute across all employees (even if offline/inactive)
    if (employees.length > 0) {
      const sortedEmployees = [...employees].sort((a, b) => a.leadCount - b.leadCount);
      const assignee = sortedEmployees[0];

      lead.assignedTo = assignee.id;
      assignee.leadCount++;
      lead.timeline.push({
        id: randomUUID(),
        action: `Auto-distributed to ${assignee.name} (Allocated offline)`,
        user: 'System',
        timestamp: new Date().toISOString()
      });
    }

    newLeads.push(lead);
    batch.set(db.collection('leads').doc(lead.id), lead);
  }

  await batch.commit();
  res.json({ success: true, count: newLeads.length });
});

app.post('/api/leads/bulk-json', async (req, res) => {
  const { leads: importedLeads, actorName } = req.body;
  if (!importedLeads || !Array.isArray(importedLeads)) {
    return res.status(400).json({ error: 'Leads array is required' });
  }

  const newLeads: Lead[] = [];
  const batch = db.batch();
  const actor = actorName || 'Admin';

  // Sync counts before distributing new leads
  const employeesSnapshot = await db.collection('employees').get();
  const employees = employeesSnapshot.docs.map(doc => doc.data() as Employee);
  await syncLeadCounts(employees);

  for (const item of importedLeads) {
    if (!item.name && !item.phone) continue;
    const lead: Lead = {
      id: randomUUID(),
      name: item.name?.trim() || 'Lead - Mobile',
      phone: item.phone?.trim() || '',
      assignedTo: null,
      status: item.status || 'New',
      notes: item.notes || '',
      followUpDate: item.followUpDate || undefined,
      createdAt: new Date().toISOString(),
      timeline: [{
        id: randomUUID(),
        action: 'Lead imported via CSV file',
        user: actor,
        timestamp: new Date().toISOString()
      }]
    };

    // Distribution logic: distribute across all employees (even if offline/inactive)
    if (employees.length > 0) {
      const sortedEmployees = [...employees].sort((a, b) => a.leadCount - b.leadCount);
      const assignee = sortedEmployees[0];
      lead.assignedTo = assignee.id;
      assignee.leadCount++;
      lead.timeline.push({
        id: randomUUID(),
        action: `Auto-distributed to ${assignee.name} (Allocated offline)`,
        user: 'System',
        timestamp: new Date().toISOString()
      });
    }

    newLeads.push(lead);
    batch.set(db.collection('leads').doc(lead.id), lead);
  }

  await batch.commit();
  res.json({ success: true, count: newLeads.length });
});

app.patch('/api/leads/:id', async (req, res) => {
  const leadDoc = await db.collection('leads').doc(req.params.id).get();
  if (!leadDoc.exists) return res.status(404).json({ error: 'Lead not found' });
  const lead = leadDoc.data() as Lead;

  if (!lead.timeline) {
    lead.timeline = [];
  }

  const actor = req.body.actorName || 'System';
  const timestamp = new Date().toISOString();

  if (req.body.status && req.body.status !== lead.status) {
    lead.timeline.push({
      id: randomUUID(),
      action: `Status updated from "${lead.status}" to "${req.body.status}"`,
      user: actor,
      timestamp
    });
    lead.status = req.body.status;
  }

  if (req.body.assignedTo !== undefined && req.body.assignedTo !== lead.assignedTo) {
    const employeesSnapshot = await db.collection('employees').get();
    const employees = employeesSnapshot.docs.map(doc => doc.data() as Employee);
    const oldEmpName = lead.assignedTo ? (employees.find(e => e.id === lead.assignedTo)?.name || 'Unknown') : 'Unassigned';
    const newEmpName = req.body.assignedTo ? (employees.find(e => e.id === req.body.assignedTo)?.name || 'Unknown') : 'Unassigned';

    lead.timeline.push({
      id: randomUUID(),
      action: `Assignment changed from ${oldEmpName} to ${newEmpName}`,
      user: actor,
      timestamp
    });
    lead.assignedTo = req.body.assignedTo;
  }

  if (req.body.notes !== undefined && req.body.notes !== lead.notes) {
    lead.timeline.push({
      id: randomUUID(),
      action: 'Updated lead note details',
      user: actor,
      timestamp,
      notes: req.body.notes
    });
    lead.notes = req.body.notes;
  }

  if (req.body.followUpDate !== undefined && req.body.followUpDate !== lead.followUpDate) {
    const displayDate = req.body.followUpDate
      ? new Date(req.body.followUpDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      : 'Removed';
    lead.timeline.push({
      id: randomUUID(),
      action: `Set follow-up reminder for ${displayDate}`,
      user: actor,
      timestamp
    });
    lead.followUpDate = req.body.followUpDate;
  }

  lead.updatedAt = timestamp;
  await db.collection('leads').doc(req.params.id).set(lead, { merge: true });
  res.json(lead);
});

app.delete('/api/leads/:id', async (req, res) => {
  await db.collection('leads').doc(req.params.id).delete();
  res.json({ success: true });
});

// Vite Integration for local dev, but on Vercel we just need to serve the static files
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  // For local dev, keep the original server setup
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // On Vercel, serve static files from dist
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
