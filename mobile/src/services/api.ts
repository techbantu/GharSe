/**
 * API Service - Backend Communication
 *
 * Purpose: Centralized API calls to GharSe backend
 * Features:
 * - Authentication
 * - Menu management
 * - Order operations
 * - Real-time updates
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(name: string, email: string, password: string, phone: string) {
    const response = await this.api.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    await this.api.post('/auth/logout');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Menu
  async getMenuItems() {
    const response = await this.api.get('/menu');
    return response.data;
  }

  async getMenuItem(id: string) {
    const response = await this.api.get(`/menu/${id}`);
    return response.data;
  }

  async searchMenu(query: string) {
    const response = await this.api.get('/search', { params: { q: query } });
    return response.data;
  }

  // Orders
  async createOrder(orderData: any) {
    const response = await this.api.post('/orders', orderData);
    return response.data;
  }

  async getOrders() {
    const response = await this.api.get('/orders/my-orders');
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.api.get(`/orders/${id}`);
    return response.data;
  }

  async cancelOrder(id: string, reason: string) {
    const response = await this.api.post(`/orders/cancel`, { orderId: id, reason });
    return response.data;
  }

  // Cart
  async validateCart(items: any[]) {
    const response = await this.api.post('/cart/validate', { items });
    return response.data;
  }

  // Payments
  async createPaymentIntent(amount: number, orderId: string) {
    const response = await this.api.post('/payments/create-intent', {
      amount,
      orderId,
    });
    return response.data;
  }

  // Coupons
  async validateCoupon(code: string) {
    const response = await this.api.post('/coupons/validate', { code });
    return response.data;
  }

  // User Profile
  async updateProfile(data: any) {
    const response = await this.api.put('/auth/update-profile', data);
    return response.data;
  }

  // Referrals
  async getReferralStats() {
    const response = await this.api.get('/customer/referral-stats');
    return response.data;
  }

  // Wallet
  async getWalletBalance() {
    const response = await this.api.get('/wallet/balance');
    return response.data;
  }
}

export default new ApiService();
