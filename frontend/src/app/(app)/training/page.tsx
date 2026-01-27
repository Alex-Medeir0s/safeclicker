import { redirect } from "next/navigation";

export default function Training() {
  // Redireciona diretamente para o módulo principal de phishing
  redirect("/phishing-training");
  return null;
}
