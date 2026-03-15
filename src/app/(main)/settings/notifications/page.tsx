'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { useCareItems } from '@/hooks/use-care-items';
import { useUpdateCareItem } from '@/hooks/use-care-items';
import { ChevronLeft, Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { BOTTOM_NAV_PADDING } from '@/lib/constants';
import { motion } from 'framer-motion';
import { requestNotificationPermission } from '@/lib/firebase/messaging';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const NOTIFICATION_SETTINGS_KEY = 'general';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: careItems } = useCareItems(null);
  const updateCareItem = useUpdateCareItem();

  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [notifyTime, setNotifyTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // 브라우저 알림 권한 상태 초기화
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      await requestNotificationPermission();
      if ('Notification' in window) {
        setNotifPermission(Notification.permission);
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Firestore에서 알림 전역 설정 불러오기
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, 'users', uid, 'notificationSettings', NOTIFICATION_SETTINGS_KEY))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.globalEnabled === 'boolean') setGlobalEnabled(data.globalEnabled);
          if (typeof data.notifyTime === 'string') setNotifyTime(data.notifyTime);
        }
      })
      .catch(() => {
        // 문서 없으면 기본값 유지
      });
  }, []);

  const saveGlobalSettings = async (nextEnabled: boolean, nextTime: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, 'users', uid, 'notificationSettings', NOTIFICATION_SETTINGS_KEY),
        {
          globalEnabled: nextEnabled,
          notifyTime: nextTime,
          updatedAt: new Date().toISOString(),
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGlobalToggle = async () => {
    const next = !globalEnabled;
    setGlobalEnabled(next);
    await saveGlobalSettings(next, notifyTime);
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setNotifyTime(next);
    await saveGlobalSettings(globalEnabled, next);
  };

  const handleCareItemToggle = (id: string, current: boolean) => {
    updateCareItem.mutate({ id, notifyEnabled: !current });
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}
    >
      {/* 헤더 */}
      <motion.header variants={item} className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:bg-secondary/80 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">알림 설정</h1>
      </motion.header>

      {/* Push 알림 권한 상태 배너 */}
      <motion.div variants={item} className="bento-item bg-primary/5 glass p-4">
        {notifPermission === 'granted' ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              알림이 활성화되어 있어요
            </p>
          </div>
        ) : notifPermission === 'denied' ? (
          <div className="flex items-start gap-3">
            <BellOff className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              브라우저 설정에서 알림을 허용해주세요
            </p>
          </div>
        ) : notifPermission === 'unsupported' ? (
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              이 브라우저는 Push 알림을 지원하지 않아요
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                알림을 허용하면 케어 시간을 놓치지 않아요
              </p>
            </div>
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-50 active:scale-95"
            >
              {isRequestingPermission ? '요청 중…' : '알림 권한 허용하기'}
            </button>
          </div>
        )}
      </motion.div>

      {/* 전체 알림 */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          전체 알림
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          {/* 전체 ON/OFF */}
          <div className="flex items-center justify-between p-4.5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-foreground/80">알림 받기</p>
                <p className="text-xs font-medium text-muted-foreground">모든 케어 알림 ON/OFF</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={globalEnabled}
              onClick={handleGlobalToggle}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                globalEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  globalEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 알림 시간 */}
          <div className="flex items-center justify-between p-4.5">
            <div>
              <p className="font-bold text-foreground/80">알림 시간</p>
              <p className="text-xs font-medium text-muted-foreground">매일 이 시간에 알림</p>
            </div>
            <input
              type="time"
              value={notifyTime}
              onChange={handleTimeChange}
              disabled={!globalEnabled || isSaving}
              className="rounded-xl border border-border/60 bg-secondary px-3 py-1.5 text-sm font-bold text-foreground/80 transition-opacity disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </motion.section>

      {/* 케어 항목별 알림 */}
      {careItems && careItems.length > 0 && (
        <motion.section variants={item} className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
            케어 항목별 알림
          </h2>
          <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
            {careItems.map((careItem) => (
              <div key={careItem.id} className="flex items-center justify-between p-4.5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-xl">
                    {careItem.icon}
                  </div>
                  <p className="font-bold text-foreground/80">{careItem.name}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={careItem.notifyEnabled}
                  onClick={() => handleCareItemToggle(careItem.id, careItem.notifyEnabled)}
                  disabled={!globalEnabled || updateCareItem.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 ${
                    careItem.notifyEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      careItem.notifyEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
