import express from "express";
import { createServer as createViteServer } from "vite";
import { jsPDF } from "jspdf";
import path from "path";
import fs from "fs";
import multer from "multer";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";
import JSZip from "jszip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localUploadsDir = path.join(process.cwd(), "uploads_fallback");

// Helper to seed missing course modules assignment PDF if it doesn't exist
function ensureAssignmentPdfExists() {
  try {
    const targetDir = path.join(localUploadsDir, "course_modules/assignment_papers");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, "1780421409366_Color_Fundamental.pdf");
    if (!fs.existsSync(targetFile)) {
      console.log("Seeding missing assignment PDF file:", targetFile);
      const doc = new jsPDF();
      
      // Header banner
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, 210, 15, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("COURSE MATERIAL  |  ENDLESS SPARK ACADEMY", 15, 10);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(24);
      doc.text("Assignment: Fundamentals of Colour", 15, 35);
      
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.line(15, 42, 195, 42);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Topic Introduction", 15, 55);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const introLines = [
        "Colour is one of the most powerful elements in design. It can evoke emotions, direct raw focus,",
        "establish brand identity, and create visual hierarchy. This module introduces the basic systems",
        "of colour organization, contrast principles, and real-world replication applications."
      ];
      let y = 63;
      introLines.forEach(line => {
        doc.text(line, 15, y);
        y += 6;
      });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Objectives & Deliverables:", 15, 90);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const tasks = [
        "1. Read the provided introductory slides on additive vs subtractive colour models (RGB vs CMYK).",
        "2. Analyze how complementary, analogous, and triadic colour schemes create contrast.",
        "3. Complete the digital worksheet matching primary colour mixes in paint and light.",
        "4. Choose two opposite warm and cool tones, and design a balanced mood board layout.",
        "5. Save your designs and submit your finished PDF to the student dashboard."
      ];
      y = 98;
      tasks.forEach(task => {
        doc.text(task, 15, y);
        y += 8;
      });
      
      // Footer marker
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 275, 195, 275);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Academy Administration Portal - Secure PDF Viewer Fallback Layer", 15, 282);
      doc.text("System Reference ID: 1780421409366_Color_Fundamental", 150, 282);

      const arrayBuffer = doc.output("arraybuffer");
      fs.writeFileSync(targetFile, Buffer.from(arrayBuffer));
      console.log("Successfully seeded assignment PDF file.");
    }
  } catch (err) {
    console.warn("Could not seed assignment PDF:", err);
  }
}

// Auto-activate Razorpay checkout gateway in Firestore settings/financial document
async function activateRazorpay() {
  try {
    const db = getDb();
    const settingsDocRef = db.collection("settings").doc("financial");
    const docSnap = await settingsDocRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data() || {};
      const razorpayDetails = data.razorpayDetails || {};
      
      // Update it to enable Razorpay if it's not already enabled
      if (!razorpayDetails.enabled) {
        console.log("Database Migration: Activating Razorpay Payment Gateway in existing financial settings...");
        await settingsDocRef.update({
          "razorpayDetails.enabled": true,
          "updatedAt": new Date().toISOString(),
          "updatedBy": "system-auto-activation"
        });
      }
    } else {
      console.log("Database Migration: Creating default financial settings document with activated Razorpay...");
      const defaultCoursesConfig = [
        { courseId: 'packaging-engineer', title: 'Diploma in Packaging Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'production-art-engineer', title: 'Diploma in Production Art Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses', fees: 35000, durationMonths: 3 }
      ];
      await settingsDocRef.set({
        coursesConfig: defaultCoursesConfig,
        emiRules: [
          { durationMonths: 3, emiCount: 2 },
          { durationMonths: 6, emiCount: 5 }
        ],
        interestRatePercentage: 7,
        penaltyPercentage: 0,
        internalReferralPercentage: 2,
        externalReferralPercentage: 5,
        razorpayDetails: {
          enabled: true,
          keyId: "",
          keySecret: ""
        },
        updatedAt: new Date().toISOString(),
        updatedBy: "system-auto-activation"
      });
    }
  } catch (err) {
    console.warn("Could not automatically activate Razorpay settings in Firestore:", err);
  }
}


// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

// Ensure upload directory exists
const uploadDir = "/tmp/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

// Helper to get Firestore with correct database ID
const getDb = () => {
  // Use the modular getFirestore which handles named databases correctly
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
    return getFirestore(firebaseConfig.firestoreDatabaseId);
  }
  return getFirestore();
};

// Helper to get Google Drive Auth object using credentials safely
const getGoogleAuth = () => {
  const scopes = ["https://www.googleapis.com/auth/drive"];
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return new google.auth.GoogleAuth({
        credentials,
        scopes,
      });
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", e);
    }
  }
  return new google.auth.GoogleAuth({
    scopes,
  });
};

// Helper to extract service account email if available
const getServiceAccountEmail = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return credentials.client_email || null;
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", e);
    }
  }
  return null;
};

const upload = multer({ 
  dest: "/tmp/uploads",
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // 5GB limit
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Local static uploads folder as a seamless fallback if GCS storage is not enabled
  if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  }
  ensureAssignmentPdfExists();
  await activateRazorpay();
  app.use("/uploads", express.static(localUploadsDir));

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY / API_KEY missing. Gemini features will not work.");
  }

  const ai = new GoogleGenAI({ 
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // Generic Gemini Generate Content API
  app.post("/api/gemini/generate-content", async (req: any, res: any) => {
    try {
      const { model, contents, config } = req.body;
      if (!model || !contents) {
        return res.status(400).json({ error: "model and contents are required" });
      }

      console.log(`Gemini API: Generating content with model ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      res.json(response);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ 
        error: {
          message: error.message,
          code: error.status || 500,
          status: error.statusText || "Internal Server Error"
        }
      });
    }
  });

  // Google Drive Sharing API
  app.post("/api/share-drive-file", async (req: any, res: any) => {
    const driveUrl = req.body.driveUrl || req.body.fileUrl;
    const rawStudentEmail = req.body.studentEmail || req.body.email;
    const role = req.body.role || "writer";
    
    if (!driveUrl || !rawStudentEmail) {
      return res.status(400).json({ error: "driveUrl and studentEmail are required" });
    }

    const studentEmail = rawStudentEmail.toLowerCase().trim();
    const clientEmail = getServiceAccountEmail();

    try {
      // Extract fileId from various Google Drive URL formats
      const fileIdMatch = driveUrl.match(/[-\w]{25,}/);
      if (!fileIdMatch) {
        return res.status(400).json({ error: "Invalid Google Drive URL or File ID" });
      }
      const fileId = fileIdMatch[0];

      // Check for credentials
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!credentialsPath && !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        console.warn("Drive automation triggered but no credentials found.");
        return res.status(501).json({ 
          error: "Google Drive automation requires GOOGLE_APPLICATION_CREDENTIALS. Please provide a service account in settings.",
          skipAutomation: true 
        });
      }

      const auth = getGoogleAuth();
      const drive = google.drive({ version: "v3", auth });

      console.log(`Auto-pilot: Sharing file ${fileId} with ${studentEmail} as ${role}`);

      // Share with studentEmail
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: role,
          type: "user",
          emailAddress: studentEmail,
        },
        sendNotificationEmail: false, // Silent sharing, no mail approval or spamming
      });

      // Try to set "anyone with the link can edit" (role: writer, type: anyone) for seamless autopilot
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: "writer",
            type: "anyone",
          },
        });
        console.log(`Auto-pilot: File ${fileId} successfully set to "anyone with the link can edit".`);
      } catch (anyoneErr: any) {
        console.warn("Could not set file permission to anyone/writer:", anyoneErr.message);
      }

      // Also automatically share with adminendlessspark@gmail.com as writer so admin always has access
      if (studentEmail !== "adminendlessspark@gmail.com") {
        console.log(`Auto-pilot: Also sharing file ${fileId} with adminendlessspark@gmail.com as writer`);
        try {
          await drive.permissions.create({
            fileId: fileId,
            requestBody: {
              role: "writer",
              type: "user",
              emailAddress: "adminendlessspark@gmail.com",
            },
            sendNotificationEmail: false,
          });
        } catch (adminErr) {
          console.warn("Could not auto-share with adminendlessspark@gmail.com:", adminErr);
        }
      }

      res.json({ success: true, message: `File shared with ${studentEmail} and admin successfully.` });
    } catch (error: any) {
      console.error("Critical Drive sharing error:", error);
      
      const isPermissionError = error.message && (
        error.message.includes("File not found") || 
        error.message.includes("permission") || 
        error.message.includes("access")
      );

      if (isPermissionError && clientEmail) {
        return res.status(403).json({
          error: `Google Drive Access Denied. To allow automatic sharing and download, please make sure the Google Drive folder/file is shared with the system service account as Editor: ${clientEmail}`,
          clientEmail,
          isPermissionIssue: true
        });
      }

      res.status(500).json({ error: error.message, clientEmail });
    }
  });

  // API to get service account email
  app.get("/api/service-account-info", (req: any, res: any) => {
    const email = getServiceAccountEmail();
    res.json({ email });
  });

  // API to check service account access to a specific Google Drive url
  app.get("/api/check-drive-access", async (req: any, res: any) => {
    const fileUrl = req.query.url as string;
    if (!fileUrl) {
      return res.status(400).json({ error: "No URL provided" });
    }

    const clientEmail = getServiceAccountEmail();
    if (!clientEmail) {
      return res.json({ 
        hasAccess: false, 
        error: "No service account credentials found. Please set GOOGLE_SERVICE_ACCOUNT_JSON in environment secrets.", 
        clientEmail: null 
      });
    }

    try {
      let fileId: string | null = null;
      let isFolder = false;

      if (fileUrl.includes("drive.google.com")) {
        if (fileUrl.includes("/folders/")) {
          const folderIdMatch = fileUrl.match(/\/folders\/([-\w]+)/);
          if (folderIdMatch) {
            fileId = folderIdMatch[1];
            isFolder = true;
          }
        } else {
          const fileIdMatch = fileUrl.match(/[-\w]{25,}/);
          if (fileIdMatch) {
            fileId = fileIdMatch[0];
          }
        }
      }

      if (!fileId) {
        return res.json({ hasAccess: false, error: "Not a valid Google Drive URL", clientEmail });
      }

      const auth = getGoogleAuth();
      const drive = google.drive({ version: "v3", auth });

      // Retrieve basic metadata to check access
      const metadata = await drive.files.get({
        fileId,
        fields: "name, mimeType"
      });

      res.json({
        hasAccess: true,
        name: metadata.data.name,
        isFolder: isFolder || metadata.data.mimeType === "application/vnd.google-apps.folder",
        clientEmail
      });
    } catch (error: any) {
      res.json({
        hasAccess: false,
        error: error.message,
        clientEmail
      });
    }
  });

  // API route to create Razorpay Order
  app.post("/api/razorpay/create-order", async (req: any, res: any) => {
    const { amount, description, razorpayDetails } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount required" });

    try {
      let keyId = process.env.RAZORPAY_KEY_ID;
      let keySecret = process.env.RAZORPAY_KEY_SECRET;
      let enabled = false;

      // First use credentials passed from client if available
      if (razorpayDetails) {
        enabled = !!razorpayDetails.enabled;
        if (razorpayDetails.keyId) {
          keyId = razorpayDetails.keyId;
        }
        if (razorpayDetails.keySecret) {
          keySecret = razorpayDetails.keySecret;
        }
      }

      // Fallback/backup: Try to read from Firestore settings
      if (!enabled || !keyId || !keySecret) {
        try {
          const db = getDb();
          const settingsDoc = await db.collection("settings").doc("financial").get();
          if (settingsDoc.exists) {
            const data = settingsDoc.data();
            if (data?.razorpayDetails) {
              if (!enabled) {
                enabled = !!data.razorpayDetails.enabled;
              }
              if (!keyId && data.razorpayDetails.keyId) {
                keyId = data.razorpayDetails.keyId;
              }
              if (!keySecret && data.razorpayDetails.keySecret) {
                keySecret = data.razorpayDetails.keySecret;
              }
            }
          }
        } catch (firestoreErr) {
          console.warn("Firestore settings read failed or skipped during Razorpay order creation:", firestoreErr);
        }
      }

      // If Razorpay is not configured or disabled, return fallback sandbox simulation mode
      if (!enabled || !keyId || !keySecret) {
        console.log("Razorpay integration: Not configured or disabled. Returning sandbox simulation token...");
        return res.json({
          mode: "sandbox_simulated",
          keyId: keyId || "rzp_test_fallback",
          amount: Math.round(amount * 100),
          currency: "INR",
          orderId: "order_mock_" + Math.random().toString(36).substring(2, 10).toUpperCase()
        });
      }

      console.log(`Razorpay connection: Creating order for ${amount} INR using key: ${keyId}`);
      
      // Perform standard checkout order creation request to razorpay
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authHeader}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay accepts in paise
          currency: "INR",
          receipt: `rcpt_${Date.now()}`
        })
      });

      if (!rzpResponse.ok) {
        const errorText = await rzpResponse.text();
        console.error("Razorpay API creation failure:", errorText);
        let cleanMsg = `Status ${rzpResponse.status}: ${errorText}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.error?.description) {
            cleanMsg = parsed.error.description;
          }
        } catch (e) {}
        throw new Error(cleanMsg);
      }

      const rzpOrder: any = await rzpResponse.json();
      console.log("Razorpay Order created successfully:", rzpOrder.id);

      return res.json({
        mode: "production_keys",
        keyId,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency
      });

    } catch (err: any) {
      console.error("Critical Razorpay integration failure:", err);
      return res.json({
        mode: "sandbox_simulated_fallback",
        keyId: "rzp_test_fallback",
        amount: Math.round(amount * 100),
        currency: "INR",
        orderId: "order_mock_fb_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        error: err.message
      });
    }
  });

  // API route to look up email by username, studentId, or phone number
  app.post("/api/get-email-by-username", async (req: any, res: any) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    try {
      const db = getDb();
      const searchStr = username.trim();
      console.log(`Backend: Looking up user by identifier: ${searchStr}`);
      
      // Try username first
      let userSnapshot = await db.collection("users")
        .where("username", "==", searchStr)
        .limit(1)
        .get();

      // If not found, try lowercase username
      if (userSnapshot.empty) {
        userSnapshot = await db.collection("users")
          .where("username", "==", searchStr.toLowerCase())
          .limit(1)
          .get();
      }

      // If still not found, try studentId (Registration Number)
      if (userSnapshot.empty) {
        userSnapshot = await db.collection("users")
          .where("studentId", "==", searchStr)
          .limit(1)
          .get();
      }

      // Try uppercase studentId (often registration numbers are uppercase)
      if (userSnapshot.empty) {
        userSnapshot = await db.collection("users")
          .where("studentId", "==", searchStr.toUpperCase())
          .limit(1)
          .get();
      }

      // Try Phone Number matching (original, with +91, with +91 space, or clean digits)
      if (userSnapshot.empty) {
        const cleanPhone = searchStr.replace(/\D/g, ''); // leaves only digits (e.g. 9876543210)
        
        // Search exact match
        userSnapshot = await db.collection("users")
          .where("phone", "==", searchStr)
          .limit(1)
          .get();
          
        if (userSnapshot.empty) {
          userSnapshot = await db.collection("users")
            .where("whatsapp", "==", searchStr)
            .limit(1)
            .get();
        }

        // Search with variants if digits-only is 10 digits
        if (userSnapshot.empty && cleanPhone.length === 10) {
          const variants = [
            `+91${cleanPhone}`,
            `+91 ${cleanPhone}`,
            cleanPhone
          ];
          
          for (const variant of variants) {
            userSnapshot = await db.collection("users")
              .where("phone", "==", variant)
              .limit(1)
              .get();
            if (!userSnapshot.empty) break;
            
            userSnapshot = await db.collection("users")
              .where("whatsapp", "==", variant)
              .limit(1)
              .get();
            if (!userSnapshot.empty) break;
          }
        }
      }

      if (userSnapshot.empty) {
        console.warn(`Backend: User lookup failed for: ${searchStr}`);
        return res.status(404).json({ error: "Username, Registration Number, or Phone Number not found. Please check your input or contact the administrator." });
      }

      const userData = userSnapshot.docs[0].data();
      if (!userData.email) {
        console.warn(`Backend: User found but email is missing for identifier: ${username}`);
        return res.status(500).json({ error: "User profile is incomplete (missing email). Please contact admin." });
      }

      console.log(`Backend: Found email ${userData.email} for identifier ${username}`);
      res.json({ email: userData.email });
    } catch (error: any) {
      console.error("Backend: Critical error finding user by username:", error);
      // Check if it's a permission error
      if (error.message && error.message.includes("PERMISSION_DENIED")) {
        return res.status(500).json({ 
          error: `Internal server error: The server does not have permission to access the Firestore database. Please ensure the service account has 'Cloud Datastore User' role on project ${firebaseConfig.projectId}.`,
          details: error.message
        });
      }
      res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
  });

  // API route for admin to force reset a user's password
  app.post("/api/admin-force-reset-password", async (req: any, res: any) => {
    const { studentId, newPassword, adminToken } = req.body;
    
    if (!studentId || !newPassword || !adminToken) {
      return res.status(400).json({ error: "studentId, newPassword, and adminToken are required" });
    }

    try {
      // 1. Verify adminToken
      const decodedToken = await admin.auth().verifyIdToken(adminToken);
      const adminUid = decodedToken.uid;

      // 2. Check if the user is actually an admin in Firestore
      const db = getDb();
      const adminDoc = await db.collection("users").doc(adminUid).get();
      const adminData = adminDoc.data();
      
      const hardcodedAdmins = [
        'adminendlessspark@gmail.com',
        'endlessspark.in@gmail.com'
      ];

      const isAuthorized = adminData?.role === 'admin' || (decodedToken.email && hardcodedAdmins.includes(decodedToken.email));

      if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized. Only admins can reset passwords." });
      }

      // 3. Update the user's password in Firebase Auth
      await admin.auth().updateUser(studentId, {
        password: newPassword
      });

      // 4. Update the user's record in Firestore
      await db.collection("users").doc(studentId).update({
        mustChangePassword: true,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, message: "Password updated successfully." });
    } catch (error: any) {
      console.error("Backend: Error force resetting password:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for file upload to bypass client-side CORS
  app.post("/api/upload-template", upload.single("file"), async (req: any, res: any) => {
    if (!req.file) {
      console.error("Backend: Upload attempt with no file in request");
      return res.status(400).json({ error: "No file provided" });
    }

    const { originalname, size, mimetype, path: tempPath } = req.file;
    const requestedPath = (req.query.path as string) || "templates";
    
    console.log(`Backend: Processing upload: ${originalname} (${size} bytes) into folder: ${requestedPath}`);
    
    try {
      const bucketNamesToTry = [
        firebaseConfig.storageBucket,
        `${firebaseConfig.projectId}.appspot.com`,
        `${firebaseConfig.projectId}.firebasestorage.app`
      ].filter((v, i, a) => v && a.indexOf(v) === i); // unique non-empty
      
      console.log(`Backend: Initializing storage. Project: ${firebaseConfig.projectId}. Buckets to try: ${bucketNamesToTry.join(', ')}`);
      
      const fileName = `${requestedPath}/${Date.now()}_${originalname.replace(/\s+/g, '_')}`;
      const useResumable = size > 50 * 1024 * 1024; // 50MB for resumable

      let uploadSuccess = false;
      let lastError: any = null;
      let finalBucketName = "";
      let storageBucket: any = null;
      let file: any = null;
      let url = "";
      let isLocalUploaded = false;

      for (const currentBucketName of bucketNamesToTry) {
        try {
          console.log(`Backend: Trying bucket: ${currentBucketName}`);
          const currentBucket = admin.storage().bucket(currentBucketName);
          const currentFile = currentBucket.file(fileName);
          
          if (size < 1024 * 1024) {
            console.log(`Backend: Using file.save() for small file on bucket: ${currentBucketName}`);
            const fileBuffer = fs.readFileSync(tempPath);
            await currentFile.save(fileBuffer, {
              metadata: { contentType: mimetype || 'application/octet-stream' },
              resumable: false
            });
          } else {
            console.log(`Backend: Using bucket.upload() (resumable: ${useResumable}) on bucket: ${currentBucketName}`);
            await currentBucket.upload(tempPath, {
              destination: fileName,
              resumable: useResumable,
              metadata: { contentType: mimetype || 'application/octet-stream' },
            });
          }
          
          // Successful upload! Keep these handles
          storageBucket = currentBucket;
          file = currentFile;
          finalBucketName = currentBucketName;
          uploadSuccess = true;
          console.log(`Backend: Upload successful with bucket ${currentBucketName}`);
          break;
        } catch (uploadErr: any) {
          console.warn(`Backend: Failed/Skipping bucket ${currentBucketName}:`, uploadErr);
          lastError = uploadErr;
        }
      }

      if (!uploadSuccess) {
        console.error("Backend: STORAGE UPLOAD ERROR across all buckets:", lastError);
        console.log("Backend: GCS upload has failed or storage is not enabled/configured. Falling back to local filesystem storage...");
        
        try {
          const relativeDest = `uploads/${requestedPath}`;
          const localDestDir = path.join(localUploadsDir, requestedPath);
          if (!fs.existsSync(localDestDir)) {
            fs.mkdirSync(localDestDir, { recursive: true });
          }
          const localFileName = `${Date.now()}_${originalname.replace(/\s+/g, '_')}`;
          const localFilePath = path.join(localDestDir, localFileName);
          
          fs.copyFileSync(tempPath, localFilePath);
          url = `/${relativeDest}/${localFileName}`;
          console.log("Backend: Successfully saved upload to local fallback path:", url);
          isLocalUploaded = true;
          uploadSuccess = true;
        } catch (localSaveErr: any) {
          console.error("Backend: Local fallback storage failed too:", localSaveErr);
          
          let customMessage = lastError?.message || "Storage upload failed.";
          const errLower = customMessage.toLowerCase();
          if (errLower.includes("not found") || errLower.includes("does not exist") || errLower.includes("404")) {
            customMessage = "Firebase Storage has not been enabled or provisioned in your Firebase Project console.\n\nPlease go to your Firebase Console (https://console.firebase.google.com), open this project, click on 'Storage' in the left-hand navigation under 'Build', and click 'Get Started' to activate Storage first.";
          } else if (errLower.includes("permission") || errLower.includes("unauthorized") || errLower.includes("403")) {
            customMessage = "Permission denied while uploading into Firebase Storage.\n\nPlease verify that current Storage rules allow writes or check if the Google Cloud Run Service Account has access to GCS. Go to your Firebase Console -> Storage and verify that its rules are initialized (default rules allow reading & writing).";
          }
          
          throw new Error(customMessage);
        }
      }

      // Cleanup temp file
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
          console.log("Temporary file cleaned up.");
        }
      } catch (cleanErr) {
        console.warn("Could not delete temporary file:", cleanErr);
      }

      // Attempt GCS access URL generation only if NOT locally saved
      if (!isLocalUploaded) {
        try {
          console.log("Generating GCS access URL...");
          // Try to make it public first
          try {
            await file.makePublic();
            url = `https://storage.googleapis.com/${finalBucketName}/${fileName}`;
            console.log("Backend: GCS file made public successfully.");
          } catch (pubErr) {
            console.warn("Backend: Could not make GCS public, using signed URL or fallback media URL...");
            try {
              const [signedUrl] = await storageBucket.file(fileName).getSignedUrl({
                action: "read",
                expires: "03-09-2491", 
              });
              url = signedUrl;
            } catch (signedErr) {
              url = `https://firebasestorage.googleapis.com/v0/b/${finalBucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
            }
          }
        } catch (urlErr: any) {
          console.error("Backend: URL generation failed:", urlErr);
          url = `https://firebasestorage.googleapis.com/v0/b/${finalBucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
        }
      }
      
      console.log("Upload process complete. Final URL:", url);
      res.json({ url });
    } catch (error: any) {
      console.error("Critical server upload error:", error);
      
      // Attempt cleanup on error
      try {
        if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (e) {}
 
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Upload failed." });
      }
    }
  });

  // API Route for WhatsApp notifications
  app.post("/api/notify-signup", async (req: any, res: any) => {
    const { studentName, studentEmail, studentPhone } = req.body;
    
    try {
      const db = getDb();
      const whatsappSettings = await db.collection("settings").doc("whatsapp").get();
      
      if (!whatsappSettings.exists || !whatsappSettings.data()?.enabled) {
        return res.json({ skip: true, message: "WhatsApp notifications disabled" });
      }

      const settings = whatsappSettings.data()!;
      const apiKey = settings.apiKey;
      const targetNumber = settings.targetNumber;

      if (!apiKey || !targetNumber) {
        return res.status(400).json({ error: "WhatsApp settings incomplete" });
      }

      // Using CallMeBot as a default free provider (can be changed to Twilio etc.)
      // CallMeBot URL format: https://api.callmebot.com/whatsapp.php?phone=[phone]&text=[text]&apikey=[apikey]
      const message = `🚀 *New Student Signup!*%0A%0A*Name:* ${studentName}%0A*Email:* ${studentEmail}${studentPhone ? `%0A*Phone:* ${studentPhone}` : ''}`;
      
      const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${targetNumber}&text=${message}&apikey=${apiKey}`;
      
      console.log("Sending WhatsApp notification via CallMeBot...");
      const response = await fetch(whatsappUrl);
      
      if (!response.ok) {
        const text = await response.text();
        console.error("WhatsApp API error:", text);
        return res.status(500).json({ error: "Failed to send WhatsApp message" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("WhatsApp notification error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to recursively list and zip a Google Drive folder
  async function zipFolder(drive: any, folderId: string, zip: any, currentPath: string = "") {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
    });
    
    const files = response.data.files || [];
    for (const file of files) {
      if (!file.id || !file.name) continue;
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
      
      if (file.mimeType === "application/vnd.google-apps.folder") {
        await zipFolder(drive, file.id, zip, filePath);
      } else {
        try {
          const fileContent = await drive.files.get(
            { fileId: file.id, alt: "media" },
            { responseType: "arraybuffer" }
          );
          zip.file(filePath, Buffer.from(fileContent.data));
        } catch (err) {
          console.error(`Error downloading file ${file.name} (ID: ${file.id}):`, err);
        }
      }
    }
  }

  // API Route for proxied download to bypass CORS/Iframe blocks and download Google Drive links directly as zip
  app.get("/api/download", async (req: any, res: any) => {
    const projectId = req.query.projectId as string;
    let fileUrl = req.query.url as string;
    let requestedTitle = req.query.title as string;

    try {
      const auth = getGoogleAuth();
      const drive = google.drive({ version: "v3", auth });

      // If projectId is provided, look up the file URL and title from Firestore
      if (projectId) {
        const db = getDb();
        const projectDoc = await db.collection("master_projects").doc(projectId).get();
        if (projectDoc.exists) {
          const pData = projectDoc.data();
          if (pData) {
            fileUrl = pData.googleDriveLink || pData.fileUrl || "";
            if (!requestedTitle && pData.title) {
              requestedTitle = pData.title;
            }
          }
        }
      }

      console.log("Proxying download. projectId:", projectId, "fileUrl:", fileUrl, "requestedTitle:", requestedTitle);

      const MASTER_FOLDER_ID = "1_bIMgMW8xqAioEq6hlz-7EgmaPgK89cz";
      let fileId: string | null = null;
      let isFolder = false;

      // Extract file ID or folder ID from the file URL if it's a Google Drive link
      if (fileUrl && fileUrl.includes("drive.google.com")) {
        if (fileUrl.includes("/folders/")) {
          const folderIdMatch = fileUrl.match(/\/folders\/([-\w]+)/);
          if (folderIdMatch) {
            fileId = folderIdMatch[1];
            isFolder = true;
          }
        } else {
          const fileIdMatch = fileUrl.match(/[-\w]{25,}/);
          if (fileIdMatch) {
            fileId = fileIdMatch[0];
          }
        }
      }

      // If we don't have a direct fileId, or if we want to ensure we search inside the Master Folder:
      if (!fileId && requestedTitle) {
        console.log(`Searching for file/folder in Master folder ${MASTER_FOLDER_ID} with title: ${requestedTitle}`);
        const escapedTitle = requestedTitle.replace(/'/g, "\\'");
        
        // Search first for folder or file in parent MASTER_FOLDER_ID matching the title
        const searchQuery = `'${MASTER_FOLDER_ID}' in parents and name contains '${escapedTitle}' and trashed = false`;
        const searchRes = await drive.files.list({
          q: searchQuery,
          fields: "files(id, name, mimeType)",
          pageSize: 5
        });

        if (searchRes.data.files && searchRes.data.files.length > 0) {
          const found = searchRes.data.files[0];
          fileId = found.id || null;
          isFolder = found.mimeType === "application/vnd.google-apps.folder";
          console.log(`Found match in Master folder: ${found.name} (ID: ${fileId}, Folder: ${isFolder})`);
        } else {
          // Try searching by name globally as fallback
          const globalQuery = `name contains '${escapedTitle}' and trashed = false`;
          const globalSearchRes = await drive.files.list({
            q: globalQuery,
            fields: "files(id, name, mimeType)",
            pageSize: 5
          });
          if (globalSearchRes.data.files && globalSearchRes.data.files.length > 0) {
            const found = globalSearchRes.data.files[0];
            fileId = found.id || null;
            isFolder = found.mimeType === "application/vnd.google-apps.folder";
            console.log(`Found global match: ${found.name} (ID: ${fileId}, Folder: ${isFolder})`);
          }
        }
      }

      // Handle download if we have an identified Google Drive fileId/folderId
      if (fileId) {
        if (isFolder) {
          console.log(`Zipping Google Drive folder ID: ${fileId}`);
          const zip = new JSZip();
          await zipFolder(drive, fileId, zip);
          
          const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
          
          let finalName = requestedTitle || "project_files";
          if (!finalName.toLowerCase().endsWith('.zip')) {
            finalName = `${finalName}.zip`;
          }

          res.setHeader("Content-Type", "application/zip");
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(finalName)}"`);
          return res.send(zipBuffer);
        } else {
          console.log(`Attempting backend Google Drive file download for file ID: ${fileId}`);
          
          // Get file metadata to determine MIME type and name
          const metadata = await drive.files.get({ fileId, fields: "name, mimeType" });
          const originalName = metadata.data.name || "project.zip";
          const mimeType = metadata.data.mimeType || "application/octet-stream";

          res.setHeader("Content-Type", mimeType);
          
          let finalName = requestedTitle || originalName;
          if (!finalName.toLowerCase().includes('.')) {
            const extMatch = originalName.match(/\.[0-9a-z]+$/i);
            if (extMatch) {
              finalName = `${finalName}${extMatch[0]}`;
            } else {
              finalName = `${finalName}.zip`;
            }
          }
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(finalName)}"`);

          const driveResponse = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
          );

          return res.send(Buffer.from(driveResponse.data as any));
        }
      }

      // If no file ID/folder ID and we have no fileUrl, return 400
      if (!fileUrl) {
        return res.status(400).send("No valid file URL, project, or Google Drive matching file found");
      }

      // Fallback / Standard URL downloader (for non-Google Drive links)
      console.log("Using standard fetch fallback for:", fileUrl);
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`External source returned ${response.status}`);
      
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const contentDisposition = response.headers.get("content-disposition");
      
      res.setHeader("Content-Type", contentType);
      
      if (requestedTitle) {
        let finalName = requestedTitle;
        if (!finalName.toLowerCase().includes('.')) {
          finalName = `${finalName}.zip`;
        }
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(finalName)}"`);
      } else if (contentDisposition) {
        res.setHeader("Content-Disposition", contentDisposition);
      }
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("Proxy download error:", error);
      if (fileUrl) {
        res.redirect(fileUrl);
      } else {
        res.status(500).send(`Failed to process download: ${error.message}`);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket for AI Agent Live Bridge
  const wss = new WebSocketServer({ server, path: "/api/chat-live" });

  wss.on("connection", async (clientWs) => {
    console.log("AI Agent: Client connected to Live Bridge");
    let session: any = null;

    clientWs.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Initialize session upon first message if needed, or allow dynamic re-init
        if (msg.type === "setup") {
          if (session) {
            try { session.close(); } catch (e) {}
          }

          console.log("AI Agent: Setting up Gemini Live session...");
          const { voiceName, systemInstruction, knowledgeBase } = msg.config || {};

          session = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            callbacks: {
              onopen: () => {
                clientWs.send(JSON.stringify({ type: "ready" }));
              },
              onmessage: (message: any) => {
                // Model output audio
                const audio = message.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
                if (audio) {
                  clientWs.send(JSON.stringify({ type: "audio", data: audio }));
                }

                // Model text/transcript
                const text = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
                if (text) {
                  clientWs.send(JSON.stringify({ type: "agent_text", data: text }));
                }

                // User transcript
                const userTranscript = message.serverContent?.inputAudioTranscription?.transcript;
                if (userTranscript) {
                  clientWs.send(JSON.stringify({ type: "user_text", data: userTranscript }));
                }

                // Interrupted
                if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }
              },
              onerror: (err: any) => {
                console.error("Gemini Live Error:", err);
                clientWs.send(JSON.stringify({ type: "error", message: err.message }));
              },
              onclose: () => {
                clientWs.send(JSON.stringify({ type: "closed" }));
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" } }
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: systemInstruction || "You are a helpful assistant."
            }
          });
        } else if (msg.type === "audio") {
          if (session) {
            session.sendRealtimeInput({
              audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } else if (msg.type === "text") {
          if (session) {
            session.sendRealtimeInput({ text: msg.data });
          }
        }
      } catch (err) {
        console.error("WSS Message handling error:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("AI Agent: Client disconnected");
      if (session) {
        try { session.close(); } catch (e) {}
        session = null;
      }
    });
  });
}

startServer();
