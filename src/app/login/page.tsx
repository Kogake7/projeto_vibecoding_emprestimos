import type { Metadata } from "next";
import LoginScreen from "../../components/login-screen";

export const metadata: Metadata = {
  title: "Entrar | EmpresTI",
  description: "Acesse o sistema interno de empréstimo de equipamentos",
};

export default function LoginPage() {
  return <LoginScreen />;
}
