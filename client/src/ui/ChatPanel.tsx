import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CHAT } from "@office/shared";
import type { OfficeSession } from "../net/office";
import { isEditableTarget } from "../scene/input";
import { chatStore, useChat, type ChatEntry } from "../store/chat";
import { formatTime } from "./chatFormat";

/** Tiempo que se ve el aviso de «demasiado rápido» (ms). */
const RATE_WARNING_MS = 3000;
/** Distancia (px) al final de la lista por debajo de la cual se considera que se está leyendo lo último. */
const STICK_THRESHOLD_PX = 24;

export const RATE_LIMIT_MESSAGE = "Estás enviando mensajes demasiado rápido";

function Entry({ entry }: { entry: ChatEntry }) {
  if (entry.kind === "notice") {
    const { kind, name } = entry.notice;
    return (
      <li className="chat__notice">
        {name} {kind === "joined" ? "ha entrado" : "ha salido"}
      </li>
    );
  }
  // Todo se pinta como nodos de texto de React: nunca se interpreta como HTML (AC-6).
  const { authorName, authorColor, text, sentAt } = entry.message;
  return (
    <li className="chat__message">
      <span className="chat__meta">
        <span className="chat__dot" style={{ background: authorColor }} aria-hidden="true" />
        <span className="chat__author">{authorName}</span>
        <time className="chat__time">{formatTime(sentAt)}</time>
      </span>
      <span className="chat__text">{text}</span>
    </li>
  );
}

/** Panel de chat de la sala, abajo a la izquierda y plegable (spec 004). */
export function ChatPanel({ session }: { session: OfficeSession | null }) {
  const entries = useChat((s) => s.entries);
  const collapsed = useChat((s) => s.collapsed);
  const unread = useChat((s) => s.unread);
  const rateLimitedAt = useChat((s) => s.rateLimitedAt);
  const [text, setText] = useState("");
  const [rateWarning, setRateWarning] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const stickToBottom = useRef(true);

  // Intro en la sala lleva al campo de escritura, desplegando el panel si hace falta (AC-10).
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Enter" || isEditableTarget(event.target)) return;
      event.preventDefault();
      chatStore.getState().setCollapsed(false);
      requestAnimationFrame(() => field.current?.focus());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Autodesplazamiento al último mensaje salvo que se esté leyendo más arriba (AC-3).
  useLayoutEffect(() => {
    const el = list.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [entries, collapsed]);

  useEffect(() => {
    if (rateLimitedAt === null) return;
    setRateWarning(true);
    const timer = setTimeout(() => setRateWarning(false), RATE_WARNING_MS);
    return () => clearTimeout(timer);
  }, [rateLimitedAt]);

  const onScroll = () => {
    const el = list.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !session) return; // vacío o solo espacios: no se envía (AC-4)
    session.sendChat(trimmed);
    setText("");
    stickToBottom.current = true;
  };

  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") field.current?.blur(); // vuelve a la sala (AC-10)
  };

  if (collapsed) {
    return (
      <button type="button" className="chat-toggle" onClick={() => chatStore.getState().setCollapsed(false)}>
        Chat
        {unread > 0 && <span className="chat-toggle__badge">{unread}</span>}
      </button>
    );
  }

  return (
    <section className="chat" aria-label="Chat de la sala">
      <header className="chat__header">
        <span>Chat</span>
        <button
          type="button"
          className="chat__collapse"
          onClick={() => chatStore.getState().setCollapsed(true)}
          aria-label="Plegar el chat"
        >
          –
        </button>
      </header>
      <ol className="chat__list" ref={list} onScroll={onScroll}>
        {entries.map((entry) => (
          <Entry key={entry.kind === "message" ? `m${entry.message.id}` : `n${entry.key}`} entry={entry} />
        ))}
      </ol>
      {rateWarning && <p className="chat__warning">{RATE_LIMIT_MESSAGE}</p>}
      <form className="chat__form" onSubmit={submit}>
        <input
          ref={field}
          className="chat__input"
          value={text}
          // Límite por caracteres, no por unidades UTF-16 (AC-5); el servidor lo vuelve a comprobar.
          onChange={(e) => setText([...e.target.value].slice(0, CHAT.maxLength).join(""))}
          onKeyDown={onFieldKeyDown}
          placeholder="Escribe un mensaje (Intro)"
          aria-label="Mensaje"
        />
        <button type="submit" className="chat__send">
          Enviar
        </button>
      </form>
    </section>
  );
}
