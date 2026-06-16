import { redirect } from "next/navigation";

// A raiz redireciona para o site de marketing por enquanto.
// Quando o site estiver implementado, este arquivo pode virar a própria home.
export default function RootPage() {
  redirect("/site");
}
