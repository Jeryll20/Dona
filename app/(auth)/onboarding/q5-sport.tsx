import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { ActivityBlock, type ActivityStatus } from '@/components/onboarding/ActivityBlock';
import { useUserStore } from '@/store/useUserStore';
import type { WeekDay } from '@/types';

export default function Q5Sport() {
  const setSport = useUserStore((s) => s.setSport);
  const stored   = useUserStore((s) => s.sport);

  const [status, setStatus] = useState<ActivityStatus>(
    stored.active ? 'yes' : stored.interested ? 'interested' : stored.active === false ? 'no' : null,
  );
  const [activity,  setActivity]  = useState(stored.activity  ?? '');
  const [days,      setDays]      = useState<WeekDay[]>(stored.days ?? []);
  const [startTime, setStartTime] = useState(stored.startTime ?? '18:00');
  const [endTime,   setEndTime]   = useState(stored.endTime   ?? '19:00');

  function handleNext() {
    setSport({
      active:     status === 'yes',
      interested: status === 'interested',
      activity:   status === 'yes' ? activity : undefined,
      days:       status === 'yes' ? days : undefined,
      startTime:  status === 'yes' ? startTime : undefined,
      endTime:    status === 'yes' ? endTime : undefined,
    });
    router.push('/(auth)/onboarding/q7-work');
  }

  return (
    <OnboardingShell
      step={5}
      eyebrow="Sport & Activité"
      eyebrowIcon="walk-outline"
      question="Fais-tu du sport ou une activité physique ?"
      onBack={() => router.push('/(auth)/onboarding/q4-meals')}
      onNext={handleNext}
      nextDisabled={status === null}
      scrollable
    >
      <ActivityBlock
        status={status}
        onStatusChange={setStatus}
        activityName={activity}
        onActivityNameChange={setActivity}
        activityPlaceholder="Ex: Football, Natation, Yoga…"
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
