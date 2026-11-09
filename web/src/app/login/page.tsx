import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Log in to B4F Board</h1>
        <LoginForm />
      </Card>
    </main>
  );
}
