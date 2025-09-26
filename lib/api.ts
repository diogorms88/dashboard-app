import { supabaseAuthService } from './supabase-auth'
import { dashboardService } from './dashboard-service'

// Configuração dinâmica da API baseada no ambiente
const getApiBaseUrl = () => {
  // Se estiver rodando no servidor (localhost), usar localhost
  // Se estiver acessando de outro computador, usar o IP do host atual
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    } else if (hostname === 'plascar.local' || hostname === 'dashboard.plascar.local') {
      return 'http://plascar.local:3000/api';
    } else {
      return `http://${hostname}:3000/api`;
    }
  }
  // Fallback para server-side rendering
  return 'http://localhost:3000/api';
}

const API_BASE_URL = getApiBaseUrl();

// Função para fazer requisições HTTP
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Adicionar token de autorização se existir
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // Se não conseguir fazer parse do JSON, usar a mensagem de status HTTP
        console.warn('Não foi possível fazer parse do erro JSON:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Se for erro de rede ou conexão
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    }
    
    console.error('Erro na requisição API:', error);
    throw error;
  }
}

// Serviços de autenticação usando Supabase
export const authService = {
  async login(username: string, senha: string) {
    const response = await supabaseAuthService.login(username, senha);
    
    // Salvar token no localStorage se o login foi bem-sucedido
    if (response.token && response.user) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  },

  async verifyToken() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const user = await supabaseAuthService.verifyToken(token);
      if (!user) {
        // Token inválido, limpar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        throw new Error('Token inválido');
      }
      
      return user;
    } catch (error) {
      // Qualquer erro de token, limpar localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      console.warn('Token inválido removido:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
};

// Serviços de usuários usando Supabase
export const userService = {
  async getUsers() {
    return await supabaseAuthService.getAllUsers();
  },

  async createUser(userData: {
    username: string;
    email: string;
    nome: string;
    senha: string;
    papel: 'admin' | 'manager' | 'operator' | 'viewer';
    ativo?: boolean;
    permissoes_customizadas?: string[];
  }) {
    return await supabaseAuthService.createUser({
      ...userData,
      ativo: userData.ativo ?? true,
      permissoes_customizadas: userData.permissoes_customizadas ?? []
    });
  },

  async updateUser(id: string, userData: {
    username?: string;
    email?: string;
    nome?: string;
    senha?: string;
    papel?: 'admin' | 'manager' | 'operator' | 'viewer';
    ativo?: boolean;
    permissoes_customizadas?: string[];
  }) {
    return await supabaseAuthService.updateUser(id, userData);
  },

  async deleteUser(id: string) {
    return await supabaseAuthService.deleteUser(id);
  },

  async resetPassword(id: string, novaSenha: string) {
    return await supabaseAuthService.resetPassword(id, novaSenha);
  }
};

// Serviço de saúde da API
export const healthService = {
  async checkHealth() {
    return await apiRequest('/health');
  }
};

// Serviços de dashboard usando Supabase
export const dashboardApiService = {
  async getDashboardData(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.calculateDashboardData(filters);
  },

  async getProductionHourlyData(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getProductionHourlyData(filters);
  },

  async getSCurveData(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getSCurveData(filters);
  },

  async getChartSummary(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getChartSummary(filters);
  },

  async getParadasByCriterio(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getParadasByCriterio(filters);
  },

  async getTopModelos(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getTopModelos(filters);
  },

  async getParetoParadas(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getParetoParadas(filters);
  },

  async getParadasByArea(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getParadasByArea(filters);
  },

  async getHeatmapParadas(filters: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }) {
    return await dashboardService.getHeatmapParadas(filters);
  }
};

// Exportar a função apiRequest para uso direto
export { apiRequest };

export default {
  authService,
  userService,
  healthService,
  dashboardApiService
};