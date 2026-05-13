"use client";

import type { MissingDataQuestionnaire } from "@/domain/evidence";

type Props = {
  questionnaire: MissingDataQuestionnaire;
};

export function MissingQuestionsPanel({ questionnaire }: Props) {
  return (
    <section className="missing-questions-panel" aria-label="Вопросы для закрытия">
      <div className="missing-questions-header">
        <div>
          <h2>Вопросы для закрытия</h2>
          <p>Краткий список открыт для ответа. Полный технический отчёт остаётся в выгрузке.</p>
        </div>
        <div className="missing-questions-badges">
          <span className="badge warning">Нужно ответить: {questionnaire.questions.length}</span>
          <span className="badge info">Закрыто: {questionnaire.closedQuestions.length}</span>
        </div>
      </div>
      {questionnaire.projectPassport && (
        <div className="missing-question passport">
          <strong>Паспорт текущего сценария</strong>
          <p>
            {String(questionnaire.projectPassport.jurisdiction ?? "РФ")},{" "}
            {String(questionnaire.projectPassport.objectPlacement ?? "отдельно стоящий блок")},{" "}
            {String(questionnaire.projectPassport.boilerPlantType ?? "газовая водогрейная котельная")},{" "}
            {String(questionnaire.projectPassport.totalHeatPowerKw ?? "0")} кВт,{" "}
            график {String(questionnaire.projectPassport.designSupplyTemperatureC ?? "80")}/
            {String(questionnaire.projectPassport.designReturnTemperatureC ?? "60")} °C.
          </p>
        </div>
      )}
      <div className="missing-question-list">
        {questionnaire.questions.map((question, index) => (
          <article className="missing-question" key={question.id}>
            <strong>{index + 1}. {question.text}</strong>
            <p>{question.reason}</p>
            <small>{question.target.kind}: {question.target.id}</small>
          </article>
        ))}
        {questionnaire.questions.length === 0 && (
          <article className="missing-question closed">
            <strong>Открытых вопросов нет</strong>
            <p>Все вопросы закрыты автоматически из модели или источников. Проверьте полный отчёт перед инженерной проверкой.</p>
          </article>
        )}
      </div>
    </section>
  );
}
