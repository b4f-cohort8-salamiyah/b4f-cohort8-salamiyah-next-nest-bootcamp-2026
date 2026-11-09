import { Card } from "@/components/ui/Card";
import { RegisterForm } from "./RegisterForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Register to B4F Board</h1>
        <RegisterForm />
      </Card>
    </main>
  );
}
