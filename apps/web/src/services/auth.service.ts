import type {
  CompleteRegistrationResponse,
  LoginResponse,
  OtpSentResponse,
  OtpVerifiedResponse,
} from '@community-marketplace/types';
import { loginSchema } from '@community-marketplace/validation';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';

interface AuthCredentials {
  email: string;
  password: string;
}

export const authService = {
  async login(credentials: AuthCredentials): Promise<LoginResponse> {
    loginSchema.parse(credentials);
    const response = await apiClient<LoginResponse>(WEB_API_ROUTES.public.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  async sendOtp(phone: string): Promise<OtpSentResponse> {
    const response = await apiClient<OtpSentResponse>(WEB_API_ROUTES.public.auth.otpSend, {
      method: 'POST',
      body: JSON.stringify({ channel: 'phone', phone, purpose: 'register' }),
    });
    return response.data;
  },

  async verifyOtp(phone: string, code: string): Promise<OtpVerifiedResponse> {
    const response = await apiClient<OtpVerifiedResponse>(WEB_API_ROUTES.public.auth.otpVerify, {
      method: 'POST',
      body: JSON.stringify({ channel: 'phone', phone, code, purpose: 'register' }),
    });
    return response.data;
  },

  async completeRegistration(input: {
    name: string;
    email: string;
    phoneVerificationToken: string;
  }): Promise<CompleteRegistrationResponse> {
    const response = await apiClient<CompleteRegistrationResponse>(
      WEB_API_ROUTES.public.auth.registerComplete,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return response.data;
  },

  async refresh(refreshToken?: string): Promise<LoginResponse> {
    const response = await apiClient<LoginResponse>(WEB_API_ROUTES.public.auth.refresh, {
      method: 'POST',
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
    return response.data;
  },

  async logout(session: { refreshToken?: string; sessionId?: string }): Promise<void> {
    await apiClient<{ loggedOut: boolean }>(WEB_API_ROUTES.public.auth.logout, {
      method: 'POST',
      body: JSON.stringify(session),
    });
  },
};
