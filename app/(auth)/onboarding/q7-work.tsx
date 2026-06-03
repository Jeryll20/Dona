import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { ActivityBlock, type ActivityStatus } from '@/components/onboarding/ActivityBlock';
import { useUserStore } from '@/store/useUserStore';
import type { WeekDay } from '@/types';

export default function Q7Work() {
  const setWork = useUserStore((s) => s.setWork);
  const stored  = useUserStore((s) => s.work);

  const [status, setStatus] = useState<ActivityStatus>(
    stored.employed ? 'yes' : stored.interested ? 'interested' : stored.employed === false ? 'no' : null,
  );
  const [role,      setRole]      = useState(stored.role      ?? '');
  const [days,      setDays]      = useState<WeekDay[]>(stored.days ?? []);
  const [startTime, setStartTime] = useState(stored.startTime ?? '09:00');
  const [endTime,   setEndTime]   = useState(stored.endTime   ?? '17:00');

  function handleNext() {
    setWork({
      employed:   status === 'yes',
      interested: status === 'interested',
      role:       status === 'yes' ? role : undefined,
      days:       status === 'yes' ? days : undefined,
      startTime:  status === 'yes' ? startTime : undefined,
      endTime:    status === 'yes' ? endTime : undefined,
    });
    router.push('/(auth)/onboarding/q8-other');
  }

  return (
    <OnboardingShell
      step={6}
      eyebrow="Emploi"
      eyebrowIcon="briefcase-outline"
      question="As-tu un emploi ou des études ?"
      onBack={() => router.push('/(auth)/onboarding/q5-sport')}
      onNext={handleNext}
      nextDisabled={status === null}
      scrollable
    >
      <ActivityBlock
        status={status}
        onStatusChange={setStatus}
        activityName={role}
        onActivityNameChange={setRole}
        activityPlaceholder="Ex: Développeur, Infirmière, Étudiant…"
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
