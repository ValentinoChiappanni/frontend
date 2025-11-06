// src/services/api.ts
// Servicio centralizado para todas las llamadas a la API del backend

import type { Prestador } from '../model/Provider.model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ==========================================
// TIPOS Y INTERFACES
// ==========================================

export interface Affiliate {
  grupoFamiliar: number;
  tipoDocumento: string;
  apellido: string;
  credencial: string;
  fecha_nacimiento: string;
  direccion: string;
  dni: string;
  nombre: string;
  parentesco: string;
  email: Array<{ idEmail: number; email: string }>;
  telefonos: Array<{ telefono: string }>;
  plan: { idPlan: number; nombre: string };
  fechaNacimiento?: string;
  direccion2?: string;
  situaciones?: Array<{ situacion: string; fechaFinalizacion: string }>;
}

// Usar el tipo Provider del modelo de dominio
export type Provider = Prestador;

export interface Plan {
  idPlan: number;
  nombre: string;
  descripcion?: string;
}

export interface Specialty {
  idEspecialidad: number;
  nombre: string;
}

export interface TherapeuticSituation {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ==========================================
// UTILIDADES HTTP
// ==========================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }

  // Si es un 204 No Content, devolver objeto vacío
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`Error en ${options.method || 'GET'} ${endpoint}:`, error);
    throw error;
  }
}

// ==========================================
// TRANSFORMADORES DE DATOS
// ==========================================

/**
 * Transforma un prestador del formato del backend al formato del frontend
 */
function transformProviderFromBackend(backendProvider: any): Provider {
  // El backend usa 'cuitCuil' (con 'i' y 'l')
  const cuit = backendProvider['cuitCuil'];
  
  return {
    id: cuit,
    cuilCuit: cuit,
    nombreCompleto: backendProvider.nombreCompleto,
    tipo: backendProvider.tipoPrestador === 'centro_medico' ? 'centro' : backendProvider.tipoPrestador,
    especialidades: backendProvider.especialidades?.map((e: any) => 
      typeof e === 'object' ? String(e.idEspecialidad) : String(e)
    ) || [],
    integraCentroMedico: backendProvider.centroMedicoId ? {
      id: backendProvider.centroMedicoId,
      nombre: backendProvider.centroMedico?.nombreCompleto || ''
    } : null,
    telefonos: backendProvider.telefonos || [],
    emails: backendProvider.mails || [],
    direcciones: backendProvider.lugarAtencion ? [{
      calle: backendProvider.lugarAtencion.direccion || '',
      numero: '',
      localidad: backendProvider.lugarAtencion.localidad || '',
      provincia: backendProvider.lugarAtencion.provincia || '',
      cp: backendProvider.lugarAtencion.codigoPostal || '',
      horarios: backendProvider.lugarAtencion.horarios?.map((h: any) => ({
        dias: h.dias || [],
        desde: h.desde || '',
        hasta: h.hasta || '',
      })) || []
    }] : []
  };
}

// ==========================================
// ENDPOINTS DE AFILIADOS
// ==========================================

export const affiliatesAPI = {
  /**
   * Obtener todos los afiliados
   * GET /api/affiliates
   */
  getAll: async (): Promise<Affiliate[]> => {
    return fetchAPI<Affiliate[]>('/api/affiliates');
  },

  /**
   * Obtener grupo familiar por DNI o credencial base
   * GET /api/affiliates/family/:dni
   */
  getFamilyGroup: async (dni: string): Promise<Affiliate[]> => {
    return fetchAPI<Affiliate[]>(`/api/affiliates/family/${dni}`);
  },

  /**
   * Crear un nuevo afiliado
   * POST /api/affiliates
   */
  create: async (affiliate: Partial<Affiliate>): Promise<Affiliate> => {
    return fetchAPI<Affiliate>('/api/affiliates', {
      method: 'POST',
      body: JSON.stringify(affiliate),
    });
  },

  /**
   * Actualizar un afiliado por DNI
   * PUT /api/affiliates/:dni
   */
  update: async (dni: string, affiliate: Partial<Affiliate>): Promise<Affiliate> => {
    return fetchAPI<Affiliate>(`/api/affiliates/${dni}`, {
      method: 'PUT',
      body: JSON.stringify(affiliate),
    });
  },

  /**
   * Eliminar un afiliado por DNI
   * DELETE /api/affiliates/:dni
   */
  delete: async (dni: string): Promise<void> => {
    return fetchAPI<void>(`/api/affiliates/${dni}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// ENDPOINTS DE PRESTADORES
// ==========================================

export const providersAPI = {
  /**
   * Obtener todos los prestadores
   * GET /providers
   */
  getAll: async (): Promise<Provider[]> => {
    const backendData = await fetchAPI<any[]>('/providers');
    return backendData.map((item) => transformProviderFromBackend(item));
  },

  /**
   * Obtener un prestador por CUIT/CUIL
   * GET /providers/:cuit
   */
  getByCuit: async (cuit: string): Promise<Provider> => {
    const backendData = await fetchAPI<any>(`/providers/${cuit}`);
    return transformProviderFromBackend(backendData);
  },

  /**
   * Crear un nuevo prestador
   * POST /providers
   */
  create: async (provider: Partial<Provider>): Promise<Provider> => {
    return fetchAPI<Provider>('/providers', {
      method: 'POST',
      body: JSON.stringify(provider),
    });
  },

  /**
   * Actualizar un prestador por CUIT/CUIL
   * PUT /providers/:cuit
   */
  update: async (cuit: string, provider: Partial<Provider>): Promise<Provider> => {
    return fetchAPI<Provider>(`/providers/${cuit}`, {
      method: 'PUT',
      body: JSON.stringify(provider),
    });
  },

  /**
   * Eliminar un prestador por CUIT/CUIL
   * DELETE /providers/:cuit
   */
  delete: async (cuit: string): Promise<void> => {
    return fetchAPI<void>(`/providers/${cuit}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// ENDPOINTS DE ESPECIALIDADES
// ==========================================

export const specialtiesAPI = {
  /**
   * Obtener todas las especialidades
   * GET /especialidades o /specialties
   */
  getAll: async (): Promise<Specialty[]> => {
    return fetchAPI<Specialty[]>('/especialidades');
  },

  /**
   * Obtener una especialidad por ID
   * GET /especialidades/:id
   */
  getById: async (id: string): Promise<Specialty> => {
    return fetchAPI<Specialty>(`/especialidades/${id}`);
  },
};

// ==========================================
// ENDPOINTS DE PLANES
// ==========================================

export const plansAPI = {
  /**
   * Obtener todos los planes
   * GET /api/plans
   */
  getAll: async (): Promise<Plan[]> => {
    return fetchAPI<Plan[]>('/api/plans');
  },
};

// ==========================================
// ENDPOINTS DE SITUACIONES TERAPÉUTICAS
// ==========================================

export const therapeuticSituationsAPI = {
  /**
   * Obtener todas las situaciones terapéuticas
   * GET /api/therapeutic
   */
  getAll: async (): Promise<TherapeuticSituation[]> => {
    return fetchAPI<TherapeuticSituation[]>('/api/therapeutic');
  },

  /**
   * Obtener una situación terapéutica por ID
   * GET /api/therapeutic/:id
   */
  getById: async (id: number): Promise<TherapeuticSituation> => {
    return fetchAPI<TherapeuticSituation>(`/api/therapeutic/${id}`);
  },
};

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  affiliates: affiliatesAPI,
  providers: providersAPI,
  specialties: specialtiesAPI,
  plans: plansAPI,
  therapeuticSituations: therapeuticSituationsAPI,
};
