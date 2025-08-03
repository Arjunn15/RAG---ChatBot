"use client";
import Image from "next/image";
import f1gptLogo from "./assets/logo.png";
import PromptSuggestionRow from "./components/PromptSugggestionsRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";
import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  const noMessages = messages.length === 0;

  const handlePromptClicked = async (text: string) => {
    await sendMessage(text);
  };

  const sendMessage = async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsBotTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: data.id || crypto.randomUUID(),
        role: "assistant",
        content: data.content || "Sorry, no reply was generated.",
      };

      setMessages([...updatedMessages, assistantMsg]);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Oops! Something went wrong while generating the response.",
      };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
  };

  return (
    <main>
      <Image src={f1gptLogo} width={250} alt="F1 GPT Logo" />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              The Ultimate place for Formula One super fans! Ask F1GPT anything about
              the fantastic world of F1 racing, and it will come back with the most up-to-date
              answers. We hope you enjoy!
            </p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePromptClicked} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isBotTyping && <LoadingBubble />}
          </>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me something..."
        />
        <input type="submit" value="Submit" />
      </form>
    </main>
  );
};

export default Home;
