import type { AiProjectInterpreter } from "@/domain/ai/AiAdapters";

export class MockAiProjectInterpreter implements AiProjectInterpreter {
  interpret(input: string): { summary: string } {
    return { summary: `Демо-интерпретация получила ${input.length} символов. Внешний AI API не вызывался.` };
  }
}
