export interface User {
  id: number
  username: string
  nome: string
  papel: 'admin' | 'user'
  senha: string
  ativo: boolean
  created_at: string
}

export interface UserWithoutPassword {
  id: number
  username: string
  nome: string
  papel: 'admin' | 'user'
  ativo: boolean
  created_at: string
}

interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void
  exec(sql: string): Array<{ columns: string[], values: unknown[][] }>
  prepare(sql: string): SqlJsStatement
  export(): Uint8Array
}

interface SqlJsStatement {
  step(): boolean
  get(): unknown[]
  getAsObject(): Record<string, unknown>
  bind(params: unknown[]): boolean
  free(): boolean
}

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number> | Buffer) => SqlJsDatabase
}

class DatabaseService {
  private db: SqlJsDatabase | null = null
  private SQL: SqlJsStatic | null = null
  private initialized = false
  private readonly DB_KEY = 'plascar_database'

  private async loadSqlJs() {
    if (typeof window === 'undefined') return null
    
    try {
      const initSqlJs = (await import('sql.js')).default
      return await initSqlJs({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) {
            return '/sql-wasm.wasm'
          }
          return file
        }
      })
    } catch (error) {
      return null
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    if (typeof window === 'undefined') return // Não executar no servidor
    
    try {
      // Carregar SQL.js dinamicamente apenas no cliente
      this.SQL = await this.loadSqlJs()
      if (!this.SQL) {
        return
      }
      
      // Tentar carregar banco existente do localStorage
      const savedDb = localStorage.getItem(this.DB_KEY)
      if (savedDb) {
        try {
          const dbData = new Uint8Array(JSON.parse(savedDb))
          this.db = new this.SQL.Database(dbData)
        } catch (error) {
          this.db = new this.SQL.Database()
          await this.createTables()
          await this.insertDefaultUsers()
          await this.saveDatabase()
        }
      } else {
        this.db = new this.SQL.Database()
        await this.createTables()
        await this.insertDefaultUsers()
        await this.saveDatabase()
      }
      
      this.initialized = true
    } catch (error) {
      // Error initializing database
    }
  }

  private async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        papel TEXT NOT NULL CHECK (papel IN ('admin', 'manager', 'operator', 'viewer')),
        senha TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    this.db.run(createUsersTable)
  }

  private async insertDefaultUsers() {
    const defaultUsers = [
      {
        username: 'admin',
        nome: 'Administrador',
        papel: 'admin',
        senha: 'admin123',
        ativo: 1
      },
      {
        username: 'gerente',
        nome: 'Gerente Sistema',
        papel: 'manager',
        senha: 'gerente123',
        ativo: 1
      },
      {
        username: 'operador',
        nome: 'Operador Padrão',
        papel: 'operator',
        senha: 'operador123',
        ativo: 1
      }
    ]

    const insertStmt = this.db.prepare(`
      INSERT INTO users (username, nome, papel, senha, ativo, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)

    defaultUsers.forEach(user => {
      insertStmt.run([
        user.username,
        user.nome,
        user.papel,
        user.senha,
        user.ativo
      ])
    })

    insertStmt.free()
    await this.saveDatabase()
  }

  private async saveDatabase() {
    const data = this.db.export()
    const buffer = Array.from(data)
    localStorage.setItem('plascar_database', JSON.stringify(buffer))
  }

  // Métodos de autenticação
  async authenticateUser(username: string, password: string): Promise<UserWithoutPassword | null> {
    if (typeof window === 'undefined') return null // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return null
    
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? AND senha = ? AND ativo = 1')
    stmt.bind([username, password])
    
    if (stmt.step()) {
      const result = stmt.getAsObject() as User
      stmt.free()
      const { senha, ...userWithoutPassword } = result
      // senha é extraída mas não usada por questão de segurança
      void senha
      return userWithoutPassword as UserWithoutPassword
    }
    
    stmt.free()
    return null
  }

  // Métodos de gerenciamento de usuários
  async getAllUsers(): Promise<UserWithoutPassword[]> {
    if (typeof window === 'undefined') return [] // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return []
    
    const stmt = this.db.prepare('SELECT id, username, nome, papel, ativo, created_at FROM users ORDER BY created_at DESC')
    const users: UserWithoutPassword[] = []
    
    while (stmt.step()) {
      users.push(stmt.getAsObject() as UserWithoutPassword)
    }
    
    stmt.free()
    return users
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<void> {
    if (typeof window === 'undefined') return // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return
    
    const stmt = this.db.prepare(`
      INSERT INTO users (username, nome, papel, senha, ativo, created_at) 
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)
    
    stmt.run([
      userData.username,
      userData.nome,
      userData.papel,
      userData.senha,
      userData.ativo ? 1 : 0
    ])
    
    stmt.free()
    await this.saveDatabase()
  }

  async updateUser(id: number, userData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    if (typeof window === 'undefined') return // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return
    
    const fields = []
    const values = []
    
    if (userData.username !== undefined) {
      fields.push('username = ?')
      values.push(userData.username)
    }
    if (userData.nome !== undefined) {
      fields.push('nome = ?')
      values.push(userData.nome)
    }
    if (userData.papel !== undefined) {
      fields.push('papel = ?')
      values.push(userData.papel)
    }
    if (userData.senha !== undefined) {
      fields.push('senha = ?')
      values.push(userData.senha)
    }
    if (userData.ativo !== undefined) {
      fields.push('ativo = ?')
      values.push(userData.ativo ? 1 : 0)
    }
    
    if (fields.length === 0) return
    
    values.push(id)
    
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(values)
    stmt.free()
    
    await this.saveDatabase()
  }

  async deleteUser(id: number): Promise<void> {
    if (typeof window === 'undefined') return // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return
    
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?')
    stmt.run([id])
    stmt.free()
    
    await this.saveDatabase()
  }

  async getUserById(id: number): Promise<UserWithoutPassword | null> {
    if (typeof window === 'undefined') return null // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return null
    
    const stmt = this.db.prepare('SELECT id, username, nome, papel, ativo, created_at FROM users WHERE id = ?')
    stmt.bind([id])
    
    if (stmt.step()) {
      const result = stmt.getAsObject() as UserWithoutPassword
      stmt.free()
      return result
    }
    
    stmt.free()
    return null
  }

  async getUserByUsername(username: string): Promise<UserWithoutPassword | null> {
    if (typeof window === 'undefined') return null // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return null
    
    const stmt = this.db.prepare('SELECT id, username, nome, papel, ativo, created_at FROM users WHERE username = ?')
    stmt.bind([username])
    
    if (stmt.step()) {
      const result = stmt.getAsObject() as UserWithoutPassword
      stmt.free()
      return result
    }
    
    stmt.free()
    return null
  }

  async resetUserPassword(id: number, newPassword: string): Promise<void> {
    if (typeof window === 'undefined') return // Não executar no servidor
    
    await this.initialize()
    if (!this.db) return
    
    const stmt = this.db.prepare('UPDATE users SET senha = ? WHERE id = ?')
    stmt.run([newPassword, id])
    stmt.free()
    
    await this.saveDatabase()
  }
}

// Singleton instance
const databaseService = new DatabaseService()
export default databaseService