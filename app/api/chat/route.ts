import { DataAPIClient } from "@datastax/astra-db-ts";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  TOGETHER_API_KEY
} = process.env;

const huggingFace = new HuggingFaceTransformersEmbeddings({
  model: 'Xenova/all-MiniLM-L6-v2',
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN as string);

const db = client.db(ASTRA_DB_API_ENDPOINT as string, {
  keyspace: ASTRA_DB_NAMESPACE as string
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const latestMessage = messages[messages.length - 1]?.content;

    // 1. Generate embedding for query
    const embedding = await huggingFace.embedQuery(latestMessage);

    // 2. Search Astra DB
    const collection = db.collection(ASTRA_DB_COLLECTION as string);
    const cursor = collection.find(null as any, {
      sort: { $vector: embedding },
      limit: 5
    });
    const documents = await cursor.toArray();

    const docContent = documents?.map(doc => doc.text).join("\n\n");

    // 3. Build prompt
    const prompt = `
You are an AI assistant that is an expert in Formula 1 racing.
Use the following context to answer the user's question.
If the answer is not in the context, respond from general F1 knowledge.

--------------------
CONTEXT:
${docContent}
--------------------
QUESTION: ${latestMessage}
ANSWER:
`;

    // 4. Call Together AI
    const togetherRes = await fetch("https://api.together.xyz/v1/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/Mistral-7B-Instruct-v0.1", // or llama-3 if you prefer
        prompt,
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
        stop: ["\n\n", "USER:", "Question:", "Q:"]
      })
    });

    const result = await togetherRes.json();
    const reply = result?.choices?.[0]?.text?.trim() || "Sorry, no response was generated.";

    return new Response(JSON.stringify({
      id: crypto.randomUUID(),
      role: "assistant",
      content: reply
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (err) {
    console.error("❌ Error in route:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
