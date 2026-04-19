import { createError } from "./CreateError.js";

export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const sanitizeAuthUser = (user) => {
  if (!user) return null;

  const plainUser =
    typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plainUser.password;
  delete plainUser.otp;
  delete plainUser.otpExpiry;
  return plainUser;
};

export const verifyCaptchaToken = async (captchaToken) => {
  if (!captchaToken) {
    throw createError("CAPTCHA token is required", 400);
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    throw createError("CAPTCHA secret key is not configured", 500);
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret,
        response: captchaToken,
      }),
    }
  );

  if (!response.ok) {
    throw createError("Unable to verify CAPTCHA right now", 502);
  }

  const data = await response.json();
  if (!data?.success) {
    throw createError("CAPTCHA validation failed", 400);
  }

  return data;
};
