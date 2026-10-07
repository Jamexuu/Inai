import { getDatabase } from './database';

export async function seedInitialDataIfEmpty(): Promise<void> {
  const db = getDatabase();

  const existingMeds = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM medicines;'
  );

  if (existingMeds[0]?.count === 0) {
    const now = new Date().toISOString();

    // Sample maintenance medicines for Mom
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
  }
}

