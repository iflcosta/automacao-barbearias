import { getDb } from './init.js';

export interface Tenant {
  id: string;
  name: string;
  whatsapp_number?: string;
  google_calendar_id?: string;
  google_credentials?: string;
  system_prompt?: string;
  created_at?: string;
}

export interface Session {
  chat_id: string;
  tenant_id: string;
  user_name?: string;
  current_state: string;
  temp_service?: string;
  temp_date?: string;
  temp_time?: string;
  updated_at?: string;
}

export interface Message {
  id?: number;
  chat_id: string;
  tenant_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export const dbHelper = {
  // --- Tenants (Barbearias) ---
  getTenant(id: string): Promise<Tenant | null> {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get('SELECT * FROM tenants WHERE id = ?', [id], (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve((row as Tenant) || null);
      });
    });
  },

  upsertTenant(tenant: Tenant): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const sql = `
        INSERT INTO tenants (id, name, whatsapp_number, google_calendar_id, google_credentials, system_prompt)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          whatsapp_number = excluded.whatsapp_number,
          google_calendar_id = excluded.google_calendar_id,
          google_credentials = excluded.google_credentials,
          system_prompt = excluded.system_prompt;
      `;
      db.run(
        sql,
        [
          tenant.id,
          tenant.name,
          tenant.whatsapp_number || null,
          tenant.google_calendar_id || null,
          tenant.google_credentials || null,
          tenant.system_prompt || null,
        ],
        (err) => {
          db.close();
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  // --- Sessions ---
  getSession(chatId: string, tenantId: string): Promise<Session> {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get('SELECT * FROM sessions WHERE chat_id = ?', [chatId], (err, row) => {
        if (err) {
          db.close();
          return reject(err);
        }

        if (row) {
          db.close();
          resolve(row as Session);
        } else {
          // Se não existir, cria uma nova sessão
          db.run(
            'INSERT INTO sessions (chat_id, tenant_id, current_state) VALUES (?, ?, ?)',
            [chatId, tenantId, 'IDLE'],
            function (insertErr) {
              db.close();
              if (insertErr) return reject(insertErr);
              resolve({
                chat_id: chatId,
                tenant_id: tenantId,
                current_state: 'IDLE',
              });
            }
          );
        }
      });
    });
  },

  updateSession(chatId: string, fields: Partial<Omit<Session, 'chat_id' | 'tenant_id'>>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const keys = Object.keys(fields);
      if (keys.length === 0) {
        db.close();
        return resolve();
      }

      const sets = keys.map((key) => `${key} = ?`).join(', ');
      const values = keys.map((key) => (fields as any)[key]);
      const sql = `UPDATE sessions SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?`;

      db.run(sql, [...values, chatId], (err) => {
        db.close();
        if (err) return reject(err);
        resolve();
      });
    });
  },

  clearSession(chatId: string): Promise<void> {
    return this.updateSession(chatId, {
      current_state: 'IDLE',
      temp_service: undefined,
      temp_date: undefined,
      temp_time: undefined,
    });
  },

  // --- Messages ---
  getMessages(chatId: string, limit = 10): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?',
        [chatId, limit],
        (err, rows) => {
          db.close();
          if (err) return reject(err);
          // Retorna na ordem cronológica correta (mais antiga primeiro)
          resolve((rows as Message[]).reverse());
        }
      );
    });
  },

  addMessage(chatId: string, tenantId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        'INSERT INTO messages (chat_id, tenant_id, role, content) VALUES (?, ?, ?, ?)',
        [chatId, tenantId, role, content],
        (err) => {
          db.close();
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },
};
