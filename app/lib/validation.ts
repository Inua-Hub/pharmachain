// app/lib/validation.ts

export const validators = {
  email: (email: string): { valid: boolean; error: string } => {
    if (!email) return { valid: false, error: "Email is required" };
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) return { valid: false, error: "Invalid email format" };
    const blocked = [
      "test.com", "example.com", "fake.com", "tempmail.com",
      "mailinator.com", "10minutemail.com", "yopmail.com",
      "guerrillamail.com", "trashmail.com", "throwaway.com",
    ];
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && blocked.includes(domain)) {
      return { valid: false, error: "Please use a real, non-disposable email" };
    }
    return { valid: true, error: "" };
  },

  name: (name: string): { valid: boolean; error: string } => {
    if (!name) return { valid: false, error: "Name is required" };
    if (name.trim().length < 3) return { valid: false, error: "Name is too short (min 3 characters)" };
    if (name.trim().length > 60) return { valid: false, error: "Name is too long (max 60 characters)" };
    if (!/^[a-zA-ZÀ-ÿ\s'.-]+$/.test(name)) {
      return { valid: false, error: "Only letters, spaces, hyphens and periods allowed" };
    }
    return { valid: true, error: "" };
  },

  phone: (phone: string): { valid: boolean; error: string } => {
    if (!phone) return { valid: false, error: "Phone number is required" };
    const cleaned = phone.replace(/[\s\-()]/g, "");
    if (!/^(\+?255|0)[67]\d{8}$/.test(cleaned)) {
      return { valid: false, error: "Use format: +255 7XX XXX XXX or 07XX XXX XXX" };
    }
    return { valid: true, error: "" };
  },

  password: (password: string): { valid: boolean; error: string; score: number } => {
    if (!password) return { valid: false, error: "Password is required", score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) score++;

    if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters", score };
    if (score < 4) return { valid: false, error: "Add uppercase letters, numbers, or symbols", score };
    return { valid: true, error: "", score };
  },

  passwordLabel: (score: number): { label: string; color: string } => {
    if (score <= 2) return { label: "Weak", color: "#ef4444" };
    if (score <= 4) return { label: "Medium", color: "#f59e0b" };
    return { label: "Strong", color: "#10b981" };
  },

  batchPrefix: (prefix: string): { valid: boolean; error: string } => {
    if (!prefix) return { valid: false, error: "Batch prefix is required" };
    const clean = prefix.trim().toUpperCase();
    if (clean.length < 3) return { valid: false, error: "Batch prefix too short (min 3 characters)" };
    if (clean.length > 30) return { valid: false, error: "Batch prefix too long" };
    if (!/^[A-Z0-9-]+$/.test(clean)) {
      return { valid: false, error: "Only A–Z, 0–9 and hyphens allowed" };
    }
    return { valid: true, error: "" };
  },
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const m = cleaned.match(/^(\+?255|0)([67]\d{8})$/);
  if (!m) return phone;
  const digits = m[2];
  return `+255 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

export const passwordStrengthColor = (score: number): string =>
  validators.passwordLabel(score).color;