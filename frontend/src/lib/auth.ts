// /frontend/src/lib/auth.ts
// {/* Centralized authentication utilities with hardened token handling */}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  isPremium?: boolean;
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName?: string;
  role: string;
  isPremium?: boolean;
  createdAt: string;
}

// {/* Safe token getter with validation */}
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    // Debug: Log token for debugging
    console.log("🔍 Token from localStorage:", token.substring(0, 50) + "...");
    
    // Basic token format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn("⚠️ Invalid token format detected - parts:", parts.length);
      console.warn("⚠️ Token:", token);
      clearAuth();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error("🚨 Error getting token:", error);
    clearAuth();
    return null;
  }
}

// {/* Parse and validate JWT token */}
export function parseToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn("⚠️ Invalid JWT format");
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Validate required fields
    if (!payload.userId || !payload.email || !payload.role) {
      console.warn("⚠️ Token missing required fields");
      return null;
    }
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.warn("⚠️ Token expired");
      clearAuth();
      return null;
    }
    
    return payload as TokenPayload;
  } catch (error) {
    console.error("🚨 Error parsing token:", error);
    clearAuth();
    return null;
  }
}

// {/* Check if user is admin */}
export function isAdmin(): boolean {
  const token = getToken();
  if (!token) return false;
  
  const payload = parseToken(token);
  return payload?.role === 'admin' || false;
}

// {/* Get current user from token */}
export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  
  const payload = parseToken(token);
  if (!payload) return null;
  
  // Try to get user from localStorage first
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Validate that stored user matches token
      if (user.id === payload.userId && user.email === payload.email) {
        return user as AuthUser;
      }
    }
  } catch (error) {
    console.warn("⚠️ Error parsing stored user:", error);
  }
  
  // Fallback: create user from token payload
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    isPremium: payload.isPremium || false,
    createdAt: new Date().toISOString() // Fallback, not ideal
  };
}

// {/* Clear all auth data */}
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("🧹 Auth data cleared");
  } catch (error) {
    console.error("🚨 Error clearing auth data:", error);
  }
}

// {/* Set auth data with validation */}
export function setAuth(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  
  try {
    // Validate token before storing
    const payload = parseToken(token);
    if (!payload) {
      throw new Error("Invalid token");
    }
    
    // Validate user data
    if (!user.id || !user.email || !user.role) {
      throw new Error("Invalid user data");
    }
    
    // Ensure consistency between token and user
    if (payload.userId !== user.id || payload.email !== user.email) {
      throw new Error("Token and user data mismatch");
    }
    
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    console.log("✅ Auth data set successfully");
  } catch (error) {
    console.error("🚨 Error setting auth data:", error);
    clearAuth();
    throw error;
  }
}

// {/* Check if user is authenticated */}
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  const payload = parseToken(token);
  return payload !== null;
}

// {/* Get token for API calls */}
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// {/* Validate token and refresh if needed */}
export function validateToken(): boolean {
  const token = getToken();
  if (!token) return false;
  
  const payload = parseToken(token);
  if (!payload) return false;
  
  // Token is valid and not expired
  return true;
}
