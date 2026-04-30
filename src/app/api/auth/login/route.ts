import { NextRequest, NextResponse } from "next/server";

// Demo credentials — reemplaza con tu lógica real (DB, Auth provider, etc.)
const DEMO_USER = {
  email: "admin@condo-net.dev",
  password: "admin123",
  name: "Admin",
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos" },
      { status: 400 }
    );
  }

  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  // En producción: genera un token JWT, setea cookie HttpOnly, etc.
  const response = NextResponse.json({
    user: { email: DEMO_USER.email, name: DEMO_USER.name },
    message: "Login exitoso",
  });

  // Cookie simple de sesión (demo)
  response.cookies.set("session", "demo-session-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 día
  });

  return response;
}
