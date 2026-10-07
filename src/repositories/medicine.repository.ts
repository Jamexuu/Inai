import { getDatabase } from '@/database/database';
import { Medicine, MedicineWithSchedules } from '@/types';

export interface IMedicineRepository {
  getAll(onlyActive?: boolean): Promise<Medicine[]>;
  getAllWithSchedules(onlyActive?: boolean): Promise<MedicineWithSchedules[]>;
  getById(id: string): Promise<Medicine | null>;
  create(medicine: Omit<Medicine, 'createdAt' | 'updatedAt'>): Promise<Medicine>;
  update(medicine: Medicine): Promise<Medicine>;
  delete(id: string): Promise<void>;
}

export class MedicineRepository implements IMedicineRepository {
  async getAll(onlyActive = true): Promise<Medicine[]> {
    const db = getDatabase();
    const query = onlyActive
      ? 'SELECT * FROM medicines WHERE is_active = 1 ORDER BY name ASC;'
      : 'SELECT * FROM medicines ORDER BY name ASC;';

    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      dosage: string;
      instructions: string | null;
      notes: string | null;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>(query);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      dosage: r.dosage,
      instructions: r.instructions ?? undefined,
      notes: r.notes ?? undefined,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getAllWithSchedules(onlyActive = true): Promise<MedicineWithSchedules[]> {
    const medicines = await this.getAll(onlyActive);
    const db = getDatabase();

    const result: MedicineWithSchedules[] = [];
    for (const med of medicines) {
      const scheduleRows = await db.getAllAsync<{
        id: string;
        medicine_id: string;
        time_slot: string;
        reminder_time: string;
        days_of_week: string;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>(
        'SELECT * FROM medicine_schedules WHERE medicine_id = ? AND is_active = 1 ORDER BY reminder_time ASC;',
        [med.id]
      );

      result.push({
        ...med,
        schedules: scheduleRows.map((s) => ({
          id: s.id,
          medicineId: s.medicine_id,
          timeSlot: s.time_slot as any,
          reminderTime: s.reminder_time,
          daysOfWeek: s.days_of_week,
          isActive: s.is_active === 1,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
      });
    }

    return result;
  }

  async getById(id: string): Promise<Medicine | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      name: string;
      dosage: string;
      instructions: string | null;
      notes: string | null;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM medicines WHERE id = ?;', [id]);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      instructions: row.instructions ?? undefined,
      notes: row.notes ?? undefined,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(medicine: Omit<Medicine, 'createdAt' | 'updatedAt'>): Promise<Medicine> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO medicines (id, name, dosage, instructions, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        medicine.id,
        medicine.name,
        medicine.dosage,
        medicine.instructions ?? null,
        medicine.notes ?? null,
        medicine.isActive ? 1 : 0,
        now,
        now,
      ]
    );

    return {
      ...medicine,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(medicine: Medicine): Promise<Medicine> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE medicines
       SET name = ?, dosage = ?, instructions = ?, notes = ?, is_active = ?, updated_at = ?
       WHERE id = ?;`,
      [
        medicine.name,
        medicine.dosage,
        medicine.instructions ?? null,
        medicine.notes ?? null,
        medicine.isActive ? 1 : 0,
        now,
        medicine.id,
      ]
    );

    return {
      ...medicine,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM medicines WHERE id = ?;', [id]);
  }
}

