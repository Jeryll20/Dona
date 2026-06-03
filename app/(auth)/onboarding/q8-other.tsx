import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { ActivityBlock, type ActivityStatus } from '@/components/onboarding/ActivityBlock';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import type { WeekDay } from '@/types';

export default function Q8Other() {
  const setOtherActivity = useUserStore((s) => s.setOtherActivity);
  const stored           = useUserStore((s) => s.otherActivity);
  const { activities, addActivity, updateActivity } = useScheduleStore();

  const [status, setStatus] = useState<ActivityStatus>(
    stored.active ? 'yes' : stored.interested ? 'interested' : stored.active === false ? 'no' : null,
  );
  const [title,     setTitle]     = useState(stored.title     ?? '');
  const [days,      setDays]      = useState<WeekDay[]>(stored.days ?? []);
  const [startTime, setStartTime] = useState(stored.startTime ?? '18:00');
  const [endTime,   setEndTime]   = useState(stored.endTime   ?? '19:00');

  function handleNext() {
    setOtherActivity({
      active:     status === 'yes',
      interested: status === 'interested',
      title:      status === 'yes' ? title : undefined,
      days:       status === 'yes' ? days : undefined,
      startTime:  status === 'yes' ? startTime : undefined,
      endTime:    status === 'yes' ? endTime : undefined,
    });
    if (status === 'yes' && startTime && endTime) {
      const data = { title: title || 'Autre activité', cat: 'activite' as const, startTime, endTime, days, recurrence: 'weekly' as const };
      if (activities.find((a) => a.id === '__other__')) updateActivity('__other__', data);
      else addActivity({ id: '__other__', ...data });
    }
    router.push('/(auth)/onboarding/q9-cycle');
  }

  return (
    <OnboardingShell
      step={7}
      eyebrow="Autre activité"
      eyebrowIcon="sparkles-outline"
      question="As-tu une autre activité régulière ?"
      sub="Cours de musique, bénévolat, apprentissage, culture…"
      onBack={() => router.push('/(auth)/onboarding/q7-work')}
      onNext={handleNext}
      nextDisabled={status === null}
      scrollable
    >
      <ActivityBlock
        status={status}
        onStatusChange={setStatus}
        activityName={title}
        onActivityNameChange={setTitle}
        activityPlaceholder="Ex: Cours de piano, Bénévolat, Dessin…"
        days={days}
        onDaysChange={setDays}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
      />
    </OnboardingShell>
  );
}
