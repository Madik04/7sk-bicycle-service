export const config = {
  path: "/api/chat"
};

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Используй POST-запрос" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { message } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY не найден в Netlify");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "Ошибка OpenAI" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const answer = data.output
      ?.flatMap(item => item.content || [])
      .find(item => item.type === "output_text")?.text || "Нет ответа";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
