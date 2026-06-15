import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    let q;
    if (user.role === 'student') {
      q = query(collection(db, 'schedule_slots'), where('studentId', '==', user.id));
    } else if (user.role === 'faculty') {
      q = query(collection(db, 'schedule_slots'), where('facultyId', '==', user.id));
    } else {
      return;
    }

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const slot = change.doc.data();
          new Notification('New Schedule Slot Added', {
            body: `A new ${slot.type} slot has been scheduled for ${slot.date} at ${slot.time}.`,
            icon: '/favicon.ico'
          });
        }
        if (change.type === 'modified') {
          const slot = change.doc.data();
          new Notification('Schedule Slot Updated', {
            body: `The ${slot.type} slot on ${slot.date} at ${slot.time} has been updated.`,
            icon: '/favicon.ico'
          });
        }
        if (change.type === 'removed') {
          const slot = change.doc.data();
          new Notification('Schedule Slot Cancelled', {
            body: `The ${slot.type} slot on ${slot.date} at ${slot.time} has been cancelled.`,
            icon: '/favicon.ico'
          });
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.GET, 'schedule_slots'));

    return () => unsubscribe();
  }, [user, permission]);

  return { permission, requestPermission };
}
