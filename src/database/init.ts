import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('database.db');

export function getDb(): sqlite3.Database {
  return new sqlite3.Database(dbPath);
}

export function initDb() {
  const db = getDb();
  db.serialize(() => {
    // Ativa suporte a chaves estrangeiras
    db.run('PRAGMA foreign_keys = ON;');

    // Tabela tenants (barbearias)
    db.run(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        whatsapp_number TEXT,
        google_calendar_id TEXT,
        google_credentials TEXT, -- JSON Stringificado
        system_prompt TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela sessions (sessões de conversa ativas)
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        chat_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_name TEXT,
        current_state TEXT DEFAULT 'IDLE',
        temp_service TEXT,
        temp_date TEXT,
        temp_time TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Tabela messages (histórico de mensagens)
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        role TEXT NOT NULL, -- 'user' ou 'assistant'
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(chat_id) REFERENCES sessions(chat_id) ON DELETE CASCADE,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Tabela appointments (agendamentos efetuados e IDs do Google Calendar)
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        google_event_id TEXT,
        status TEXT DEFAULT 'CONFIRMED', -- 'CONFIRMED' ou 'CANCELLED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(chat_id) REFERENCES sessions(chat_id) ON DELETE CASCADE,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);
  });
  console.log('Banco de dados inicializado com sucesso.');
  db.close();
}

// Se executado diretamente
initDb();
