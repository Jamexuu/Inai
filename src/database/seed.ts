import { getDatabase } from './database';

declare global {
  var __inai_seed_promise__: Promise<void> | undefined;
}

export function seedInitialDataIfEmpty(): Promise<void> {
  if (globalThis.__inai_seed_promise__) {
    return globalThis.__inai_seed_promise__;
  }

  globalThis.__inai_seed_promise__ = (async () => {
    const db = getDatabase();

    // 1. Medicines
    const existingMeds = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM medicines;'
    );

    if (existingMeds[0]?.count === 0) {
      const now = new Date().toISOString();

      const sampleMedicines = [
        {
          id: 'med_sample_amlodipine',
          name: 'Amlodipine',
          dosage: '5 mg (1 tablet)',
          instructions: 'Take after breakfast with water',
          notes: 'For blood pressure',
          schedules: [
            {
              id: 'sch_sample_amlo_morning',
              time_slot: 'morning',
              reminder_time: '08:00',
            },
          ],
        },
        {
          id: 'med_sample_metformin',
          name: 'Metformin',
          dosage: '500 mg (1 tablet)',
          instructions: 'Take during or after lunch',
          notes: 'For blood sugar management',
          schedules: [
            {
              id: 'sch_sample_met_lunch',
              time_slot: 'afternoon',
              reminder_time: '12:30',
            },
          ],
        },
        {
          id: 'med_sample_atorvastatin',
          name: 'Atorvastatin',
          dosage: '20 mg (1 tablet)',
          instructions: 'Take at bedtime',
          notes: 'For cholesterol',
          schedules: [
            {
              id: 'sch_sample_ator_bed',
              time_slot: 'bedtime',
              reminder_time: '21:00',
            },
          ],
        },
      ];

      await db.withTransactionAsync(async () => {
        for (const med of sampleMedicines) {
          await db.runAsync(
            `INSERT INTO medicines (id, name, dosage, instructions, notes, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
            [med.id, med.name, med.dosage, med.instructions, med.notes, now, now]
          );

          for (const sch of med.schedules) {
            await db.runAsync(
              `INSERT INTO medicine_schedules (id, medicine_id, time_slot, reminder_time, days_of_week, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'ALL', 1, ?, ?);`,
              [sch.id, med.id, sch.time_slot, sch.reminder_time, now, now]
            );
          }
        }
      });
    }

    // 2. Blood Pressure Logs Seed
    const existingBP = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM blood_pressure_logs;'
    );

    if (existingBP[0]?.count === 0) {
      const baseDate = new Date();
      const bpSeedItems: Array<{
        daysAgo?: number;
        monthsAgo?: number;
        time: string;
        sys: number;
        dia: number;
        pulse: number;
        notes: string;
      }> = [
        // Today
        { daysAgo: 0, time: '08:00', sys: 120, dia: 78, pulse: 72, notes: 'Morning rested reading' },
        { daysAgo: 0, time: '19:00', sys: 124, dia: 80, pulse: 75, notes: 'Evening check' },
        // This Week
        { daysAgo: 1, time: '08:15', sys: 118, dia: 76, pulse: 70, notes: 'Feeling great' },
        { daysAgo: 2, time: '08:00', sys: 122, dia: 82, pulse: 74, notes: 'After morning tea' },
        { daysAgo: 3, time: '08:30', sys: 126, dia: 80, pulse: 76, notes: 'Morning check' },
        { daysAgo: 4, time: '08:00', sys: 119, dia: 77, pulse: 71, notes: 'Rested and calm' },
        { daysAgo: 5, time: '08:10', sys: 123, dia: 81, pulse: 73, notes: 'Morning check' },
        { daysAgo: 6, time: '08:00', sys: 121, dia: 79, pulse: 72, notes: 'Sunday morning' },
        // Past Weeks of this month
        { daysAgo: 10, time: '08:00', sys: 124, dia: 82, pulse: 75, notes: '' },
        { daysAgo: 14, time: '08:00', sys: 120, dia: 78, pulse: 71, notes: '' },
        { daysAgo: 18, time: '08:00', sys: 125, dia: 81, pulse: 74, notes: '' },
        { daysAgo: 22, time: '08:00', sys: 122, dia: 79, pulse: 72, notes: '' },
        // Past Months in the current year
        { monthsAgo: 1, time: '08:00', sys: 123, dia: 80, pulse: 73, notes: 'Monthly routine check' },
        { monthsAgo: 2, time: '08:00', sys: 121, dia: 79, pulse: 72, notes: 'Monthly routine check' },
        { monthsAgo: 3, time: '08:00', sys: 125, dia: 82, pulse: 75, notes: 'Monthly routine check' },
        { monthsAgo: 4, time: '08:00', sys: 122, dia: 78, pulse: 70, notes: 'Monthly routine check' },
      ];

      await db.withTransactionAsync(async () => {
        for (let i = 0; i < bpSeedItems.length; i++) {
          const item = bpSeedItems[i];
          const d = new Date(baseDate);
          if (item.daysAgo !== undefined) {
            d.setDate(d.getDate() - item.daysAgo);
          } else if (item.monthsAgo !== undefined) {
            d.setMonth(d.getMonth() - item.monthsAgo);
            d.setDate(15);
          }
          const [h, m] = item.time.split(':').map((v) => parseInt(v, 10));
          d.setHours(h, m, 0, 0);
          const iso = d.toISOString();
          const id = `bp_seed_${Date.now()}_${i}`;

          await db.runAsync(
            `INSERT INTO blood_pressure_logs (id, systolic, diastolic, pulse, logged_at, notes, arm, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'left', ?, ?);`,
            [id, item.sys, item.dia, item.pulse, iso, item.notes || null, iso, iso]
          );
        }
      });
    }

    // 3. Blood Sugar Logs Seed
    const existingSugar = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM blood_sugar_logs;'
    );

    if (existingSugar[0]?.count === 0) {
      const baseDate = new Date();
      const sugarSeedItems: Array<{
        daysAgo?: number;
        monthsAgo?: number;
        time: string;
        level: number;
        context: string;
        notes: string;
      }> = [
        // Today
        { daysAgo: 0, time: '07:45', level: 98, context: 'fasting', notes: 'Before breakfast' },
        { daysAgo: 0, time: '13:45', level: 128, context: 'after_meal', notes: '2 hrs after lunch' },
        // This Week
        { daysAgo: 1, time: '07:50', level: 102, context: 'fasting', notes: 'Fasting' },
        { daysAgo: 1, time: '20:30', level: 135, context: 'after_meal', notes: 'After dinner' },
        { daysAgo: 2, time: '08:00', level: 96, context: 'fasting', notes: 'Fasting' },
        { daysAgo: 2, time: '14:00', level: 122, context: 'after_meal', notes: 'After lunch' },
        { daysAgo: 3, time: '07:40', level: 105, context: 'fasting', notes: 'Fasting' },
        { daysAgo: 3, time: '21:30', level: 118, context: 'bedtime', notes: 'Before sleep' },
        { daysAgo: 4, time: '08:15', level: 99, context: 'fasting', notes: 'Fasting' },
        { daysAgo: 5, time: '07:55', level: 104, context: 'fasting', notes: 'Fasting' },
        { daysAgo: 6, time: '08:00', level: 97, context: 'fasting', notes: 'Sunday morning' },
        // Earlier this month
        { daysAgo: 10, time: '08:00', level: 101, context: 'fasting', notes: '' },
        { daysAgo: 14, time: '08:00', level: 98, context: 'fasting', notes: '' },
        { daysAgo: 18, time: '08:00', level: 106, context: 'fasting', notes: '' },
        { daysAgo: 22, time: '08:00', level: 100, context: 'fasting', notes: '' },
        // Past Months in the current year
        { monthsAgo: 1, time: '08:00', level: 103, context: 'fasting', notes: 'Monthly routine check' },
        { monthsAgo: 2, time: '08:00', level: 100, context: 'fasting', notes: 'Monthly routine check' },
        { monthsAgo: 3, time: '08:00', level: 108, context: 'fasting', notes: 'Monthly routine check' },
        { monthsAgo: 4, time: '08:00', level: 102, context: 'fasting', notes: 'Monthly routine check' },
      ];

      await db.withTransactionAsync(async () => {
        for (let i = 0; i < sugarSeedItems.length; i++) {
          const item = sugarSeedItems[i];
          const d = new Date(baseDate);
          if (item.daysAgo !== undefined) {
            d.setDate(d.getDate() - item.daysAgo);
          } else if (item.monthsAgo !== undefined) {
            d.setMonth(d.getMonth() - item.monthsAgo);
            d.setDate(15);
          }
          const [h, m] = item.time.split(':').map((v) => parseInt(v, 10));
          d.setHours(h, m, 0, 0);
          const iso = d.toISOString();
          const id = `sugar_seed_${Date.now()}_${i}`;

          await db.runAsync(
            `INSERT INTO blood_sugar_logs (id, level, context, logged_at, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [id, item.level, item.context, iso, item.notes || null, iso, iso]
          );
        }
      });
    }
  })();

  return globalThis.__inai_seed_promise__;
}
