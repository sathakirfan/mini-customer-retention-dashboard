export async function checkAuthSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth');
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.authenticated;
  } catch (error) {
    console.error('Failed to check auth session:', error);
    return false;
  }
}

export async function loginSession(username: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await res.json();
    return {
      success: res.ok,
      message: data.message || (res.ok ? 'Success' : 'Invalid credentials'),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Failed to connect to authentication server.',
    };
  }
}

export async function logoutSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}
