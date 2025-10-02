import { 
  AuthenticationApi, 
  CategoriesApi, 
  TransactionsApi, 
  StatisticsApi, 
  UserApi,
  PropertiesApi,
  RealEstateTransactionsApi,
  RealEstateStatsApi,
  Configuration
} from '../generated'
import type {
  ModelsLoginRequest,
  ModelsLoginResponse,
  ModelsRegisterRequest,
  ModelsAcceptInvitationRequest,
  ModelsUser,
  ModelsCategory,
  ModelsCategoriesResponse,
  ModelsCreateCategoryRequest,
  ModelsUpdateCategoryRequest,
  ModelsTransaction,
  ModelsTransactionListResponse,
  ModelsCreateTransactionRequest,
  ModelsUpdateTransactionRequest,
  StatsYearlyGet200Response,
  ModelsProperty,
  ModelsCreatePropertyRequest,
  ModelsUpdatePropertyRequest,
  ModelsRealEstateTransaction,
  ModelsCreateRealEstateTransactionRequest,
  ModelsUpdateRealEstateTransactionRequest,
  ModelsRealEstateMonthlyStats,
  PropertiesGet200Response,
  RealEstateTransactionsGet200Response,
  RealEstateStatsMonthlyGet200Response,
  RealEstateStatsYearlyGet200Response,
  RealEstateStatsLifetimeGet200Response
} from '../generated'

// Create configuration with token interceptor
const createApiConfig = (): Configuration => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return new Configuration({
    basePath: `${baseUrl}/api/v1`,
    apiKey: (keyParamName: string) => {
      const token = localStorage.getItem('auth_token')
      console.log('API Config - Token retrieved for', keyParamName, ':', token ? `${token.substring(0, 10)}...` : 'null')
      // Return the full Bearer token format since the API expects Authorization header value
      return token ? `Bearer ${token}` : ''
    }
  })
}

// Create API instances with authentication
const getAuthApi = () => new AuthenticationApi(createApiConfig())
const getCategoriesApi = () => new CategoriesApi(createApiConfig())
const getTransactionsApi = () => new TransactionsApi(createApiConfig())
const getStatsApi = () => new StatisticsApi(createApiConfig())
const getUserApi = () => new UserApi(createApiConfig())
const getPropertiesApi = () => new PropertiesApi(createApiConfig())
const getRealEstateTransactionsApi = () => new RealEstateTransactionsApi(createApiConfig())
const getRealEstateStatsApi = () => new RealEstateStatsApi(createApiConfig())

// Export compatible API interfaces
export const authApi = {
  login: async (data: ModelsLoginRequest): Promise<ModelsLoginResponse> => {
    const response = await getAuthApi().authLoginPost({ request: data })
    return response.data
  },
  
  register: async (data: ModelsRegisterRequest): Promise<{ message: string; token: string; user_id: string }> => {
    const response = await getAuthApi().authRegisterPost({ request: data })
    return response.data as { message: string; token: string; user_id: string }
  },
  
  acceptInvitation: async (data: ModelsAcceptInvitationRequest): Promise<{ message: string }> => {
    const response = await getAuthApi().authAcceptInvitationPost({ request: data })
    return response.data as { message: string }
  }
}

export const userApi = {
  getProfile: async (): Promise<ModelsUser> => {
    const response = await getUserApi().profileGet()
    return response.data
  },
  
  updateProfile: async (data: { nickname?: string }): Promise<ModelsUser> => {
    const response = await getUserApi().profilePut({ request: data })
    return response.data
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<void> => {
    await getUserApi().profilePasswordPut({ request: data })
  }
}

export const categoriesApi = {
  list: async (params?: { type?: 'INCOME' | 'EXPENSE'; active?: boolean }): Promise<ModelsCategory[]> => {
    const response = await getCategoriesApi().categoriesGet({ 
      type: params?.type, 
      active: params?.active 
    })
    const data = response.data as ModelsCategoriesResponse
    return data.categories || []
  },
  
  get: async (id: string): Promise<ModelsCategory> => {
    const response = await getCategoriesApi().categoriesIdGet({ id })
    return response.data
  },
  
  create: async (data: ModelsCreateCategoryRequest): Promise<ModelsCategory> => {
    const response = await getCategoriesApi().categoriesPost({ request: data })
    return response.data
  },
  
  update: async (id: string, data: ModelsUpdateCategoryRequest): Promise<ModelsCategory> => {
    const response = await getCategoriesApi().categoriesIdPut({ 
      id, 
      request: data 
    })
    return response.data
  },
  
  delete: async (id: string): Promise<void> => {
    await getCategoriesApi().categoriesIdDelete({ id })
  }
}

export const transactionsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    fromDate?: string;
    toDate?: string
  }): Promise<{ transactions: ModelsTransaction[]; total: number }> => {
    const response = await getTransactionsApi().transactionsGet({
      offset: params?.page ? (params.page - 1) * (params.limit || 20) : undefined,
      limit: params?.limit,
      categoryId: params?.categoryId,
      fromDate: params?.fromDate,
      toDate: params?.toDate
    })
    const data = response.data as ModelsTransactionListResponse
    return {
      transactions: data.transactions || [],
      total: data.total || 0
    }
  },
  
  get: async (id: string): Promise<ModelsTransaction> => {
    const response = await getTransactionsApi().transactionsIdGet({ id })
    return response.data
  },
  
  create: async (data: ModelsCreateTransactionRequest): Promise<ModelsTransaction> => {
    const response = await getTransactionsApi().transactionsPost({ request: data })
    return response.data
  },
  
  update: async (id: string, data: ModelsUpdateTransactionRequest): Promise<ModelsTransaction> => {
    const response = await getTransactionsApi().transactionsIdPut({ 
      id, 
      request: data 
    })
    return response.data
  },
  
  delete: async (id: string): Promise<void> => {
    await getTransactionsApi().transactionsIdDelete({ id })
  }
}

export const statsApi = {
  monthly: async (year: number, month: number): Promise<any> => {
    const response = await getStatsApi().statsMonthlyGet({ year, month })
    const data = response.data as any
    return data.monthly!
  },
  
  yearly: async (year: number): Promise<StatsYearlyGet200Response> => {
    const response = await getStatsApi().statsYearlyGet({ year })
    return response.data as StatsYearlyGet200Response
  },
  
  categories: async (fromDate: string, toDate: string): Promise<any[]> => {
    const response = await getStatsApi().statsCategoriesGet({ fromDate, toDate })
    const data = response.data as any
    return data.categories || []
  }
}


export const realEstateApi = {
  properties: {
    list: async (): Promise<ModelsProperty[]> => {
      const response = await getPropertiesApi().propertiesGet({ withBalance: true })
      const data = response.data as PropertiesGet200Response
      return data.properties || []
    },
    get: async (id: string): Promise<ModelsProperty> => {
      const response = await getPropertiesApi().propertiesIdGet({ id })
      return response.data
    },
    create: async (data: ModelsCreatePropertyRequest): Promise<ModelsProperty> => {
      const response = await getPropertiesApi().propertiesPost({ property: data })
      return response.data
    },
    update: async (id: string, data: ModelsUpdatePropertyRequest): Promise<ModelsProperty> => {
      const response = await getPropertiesApi().propertiesIdPut({ id, property: data })
      return response.data
    },
    delete: async (id: string): Promise<void> => {
      await getPropertiesApi().propertiesIdDelete({ id })
    }
  },
  transactions: {
    list: async (params?: { 
      propertyId?: string; 
      type?: string; 
      limit?: number; 
      offset?: number 
    }): Promise<{ transactions: ModelsRealEstateTransaction[]; total: number; limit: number; offset: number }> => {
      const response = await getRealEstateTransactionsApi().realEstateTransactionsGet({
        propertyId: params?.propertyId,
        type: params?.type,
        limit: params?.limit,
        offset: params?.offset
      })
      const data = response.data as RealEstateTransactionsGet200Response
      return {
        transactions: data.transactions || [],
        total: data.total || 0,
        limit: data.limit || 20,
        offset: data.offset || 0
      }
    },
    get: async (id: string): Promise<ModelsRealEstateTransaction> => {
      const response = await getRealEstateTransactionsApi().realEstateTransactionsIdGet({ id })
      return response.data
    },
    create: async (data: ModelsCreateRealEstateTransactionRequest): Promise<ModelsRealEstateTransaction> => {
      const response = await getRealEstateTransactionsApi().realEstateTransactionsPost({ transaction: data })
      return response.data
    },
    update: async (id: string, data: ModelsUpdateRealEstateTransactionRequest): Promise<ModelsRealEstateTransaction> => {
      const response = await getRealEstateTransactionsApi().realEstateTransactionsIdPut({ id, transaction: data })
      return response.data
    },
    delete: async (id: string): Promise<void> => {
      await getRealEstateTransactionsApi().realEstateTransactionsIdDelete({ id })
    }
  },
  stats: {
    monthly: async (year: number, month: number, propertyId?: string): Promise<ModelsRealEstateMonthlyStats> => {
      const response = await getRealEstateStatsApi().realEstateStatsMonthlyGet({ year, month, propertyId })
      const data = response.data as RealEstateStatsMonthlyGet200Response
      return data.monthly!
    },
    yearly: async (year: number, propertyId?: string): Promise<RealEstateStatsYearlyGet200Response> => {
      const response = await getRealEstateStatsApi().realEstateStatsYearlyGet({ year, propertyId })
      return response.data as RealEstateStatsYearlyGet200Response
    },
    lifetime: async (propertyId?: string): Promise<RealEstateStatsLifetimeGet200Response> => {
      const response = await getRealEstateStatsApi().realEstateStatsLifetimeGet({ propertyId })
      return response.data as RealEstateStatsLifetimeGet200Response
    }
  }
}

export default {
  authApi,
  userApi,
  categoriesApi,
  transactionsApi,
  statsApi,
  realEstateApi
}