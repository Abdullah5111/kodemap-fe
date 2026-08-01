import { api } from "./api";
import { tokens } from "./tokens";
import type { User } from "./types";

/** Auth endpoints return the access token in the body; the refresh token is
    delivered separately as an httpOnly cookie the browser stores automatically. */
interface AccessResponse {
  access: string;
}

export interface ProfileUpdate {
  full_name?: string;
  education_level?: string;
  institution?: string;
  field_of_study?: string;
  graduation_year?: number | null;
  current_year?: string;
  github_url?: string;
  bio?: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name: string;
  education_level?: string;
  institution?: string;
  field_of_study?: string;
  graduation_year?: number;
  current_year?: string;
  github_url?: string;
  bio?: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<void> {
    await api.post("/auth/register", payload);
  },

  /** Verify the signup OTP; on success the backend returns an access token (and
      sets the refresh cookie), and we keep the access token in memory. */
  async verifyEmail(email: string, code: string): Promise<void> {
    const { data } = await api.post<AccessResponse & { detail: string }>(
      "/auth/verify-email",
      { email, code },
    );
    tokens.setAccess(data.access);
  },

  async resendOtp(email: string): Promise<void> {
    await api.post("/auth/resend-otp", { email });
  },

  async login(email: string, password: string): Promise<void> {
    const { data } = await api.post<AccessResponse>("/auth/login", { email, password });
    tokens.setAccess(data.access);
  },

  async requestReset(email: string): Promise<void> {
    await api.post("/auth/password-reset/request", { email });
  },

  async confirmReset(email: string, code: string, newPassword: string): Promise<void> {
    await api.post("/auth/password-reset/confirm", {
      email,
      code,
      new_password: newPassword,
    });
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/me");
    return data;
  },

  async updateProfile(payload: ProfileUpdate): Promise<User> {
    const { data } = await api.patch<User>("/me", payload);
    return data;
  },

  /** Multipart PATCH — axios sets the boundary content-type from the FormData. */
  async uploadAvatar(file: File): Promise<User> {
    const fd = new FormData();
    fd.append("avatar", file);
    const { data } = await api.patch<User>("/me", fd);
    return data;
  },

  /** Clear server-side (blacklist refresh + expire the cookie), then drop the
      in-memory access token. Backend failure still clears locally. */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch {
      // best effort — clear locally regardless
    }
    tokens.clear();
  },
};
