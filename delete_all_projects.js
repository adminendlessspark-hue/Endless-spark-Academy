import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function deleteAll() {
  console.log('Deleting all master_projects...');
  const masterDocs = await getDocs(collection(db, 'master_projects'));
  for (const d of masterDocs.docs) {
    await deleteDoc(doc(db, 'master_projects', d.id));
    console.log('Deleted master', d.id);
  }

  console.log('Deleting all student_projects...');
  const studentDocs = await getDocs(collection(db, 'student_projects'));
  for (const d of studentDocs.docs) {
    await deleteDoc(doc(db, 'student_projects', d.id));
    console.log('Deleted student project', d.id);
  }
  console.log('Done');
}

deleteAll().catch(console.error);
