<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { http } from "@/utils/http";

type Message = { id?: number; senderType: number; aiFlag?: number; senderName?: string; content: string; createTime?: string };
const opened = ref(false);
const connected = ref(false);
const input = ref("");
const messages = ref<Message[]>([]);
const sessionId = ref<number>();
const pendingContent = ref("");
const errorText = ref("");
const unreadCount = ref(0);
const messageListRef = ref<HTMLElement>();
let socket: WebSocket | undefined;

function guestId() {
  const key = "hy_qsyy_chat_guest_id";
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  const value = crypto.randomUUID();
  localStorage.setItem(key, value);
  return value;
}

function wsUrl() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const port = import.meta.env.DEV ? ":8081" : location.port ? `:${location.port}` : "";
  return `${protocol}://${location.hostname}${port}/ws/chat?role=guest&guestId=${guestId()}`;
}

function connect() {
  if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
  errorText.value = "";
  socket = new WebSocket(wsUrl());
  socket.onopen = () => { connected.value = true; socket?.send(JSON.stringify({ action: "join" })); };
  socket.onclose = () => { connected.value = false; errorText.value = "连接客服失败，请稍后重试"; };
  socket.onmessage = async event => {
    const payload = JSON.parse(event.data);
    if (payload.action === "join") {
      sessionId.value = payload.sessionId;
      await loadHistory();
      flushPendingMessage();
    }
    if (payload.action === "chat" && payload.data) {
      messages.value.push(payload.data);
      if (!opened.value && payload.data.senderType === 2) {
        unreadCount.value += 1;
      }
      await nextTick();
      scrollToLatest();
    }
  };
}

async function loadHistory() {
  if (!sessionId.value) return;
  try {
    const response: any = await http.get("/api/common/chat/messages", {
      params: { sessionId: sessionId.value, guestId: guestId() }
    });
    messages.value = response.result || [];
    await nextTick();
    scrollToLatest();
  } catch {
    errorText.value = "聊天记录加载失败";
  }
}

function toggle() {
  opened.value = !opened.value;
  if (opened.value) {
    unreadCount.value = 0;
    connect();
    nextTick(scrollToLatest);
  }
}

function send() {
  const content = input.value.trim();
  if (!content) return;
  pendingContent.value = content;
  input.value = "";
  if (socket?.readyState !== WebSocket.OPEN || !sessionId.value) {
    connect();
    return;
  }
  flushPendingMessage();
}

function flushPendingMessage() {
  if (!pendingContent.value || !sessionId.value || socket?.readyState !== WebSocket.OPEN) return;
  const content = pendingContent.value;
  pendingContent.value = "";
  socket.send(JSON.stringify({ action: "chat", sessionId: sessionId.value, content }));
}

function scrollToLatest() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
}

onMounted(connect);
onBeforeUnmount(() => socket?.close());
</script>

<template>
  <div class="chat-widget">
    <section v-if="opened" class="chat-window">
      <header><strong>在线客服</strong><button type="button" aria-label="关闭聊天" @click="toggle">×</button></header>
      <div ref="messageListRef" class="chat-messages">
        <p v-if="!messages.length" class="chat-hint">您好，有什么可以帮您？</p>
        <div
          v-for="message in messages"
          :key="message.id || message.createTime"
          :class="['bubble', message.senderType === 1 ? 'self' : 'peer', message.aiFlag === 1 ? 'ai' : '']"
        >
          <span v-if="message.senderType !== 1" class="bubble-tag">{{ message.aiFlag === 1 ? "AI" : (message.senderName || "人工") }}</span>
          <p>{{ message.content }}</p>
        </div>
      </div>
      <form @submit.prevent="send"><input v-model="input" placeholder="输入消息" /><button type="submit">发送</button></form>
      <p v-if="errorText" class="chat-error">{{ errorText }}</p>
    </section>
    <button class="chat-trigger" type="button" aria-label="打开在线客服" @click="toggle"><img src="/chat-agent.png" alt="" /><span v-if="unreadCount" class="chat-badge">{{ unreadCount > 99 ? "99+" : unreadCount }}</span></button>
  </div>
</template>

<style scoped>
.chat-widget{position:fixed;right:24px;bottom:24px;z-index:1000}.chat-trigger{position:relative;width:62px;height:62px;padding:0;border:0;border-radius:50%;overflow:visible;cursor:pointer;box-shadow:0 8px 24px #18324a55;background:#dff3ef}.chat-trigger img{width:100%;height:100%;object-fit:cover;border-radius:50%}.chat-badge{position:absolute;top:-4px;right:-4px;min-width:19px;height:19px;padding:0 5px;font-size:11px;line-height:19px;color:#fff;background:#e34d59;border:2px solid #fff;border-radius:10px}.chat-window{position:absolute;right:0;bottom:76px;width:min(360px,calc(100vw - 32px));height:460px;display:flex;flex-direction:column;background:#fff;border:1px solid #dce5ea;border-radius:8px;box-shadow:0 14px 38px #14253633;overflow:hidden}.chat-window header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;color:#fff;background:#176a82}.chat-window header button{font-size:24px;color:#fff;border:0;background:transparent;cursor:pointer}.chat-messages{display:flex;flex:1;flex-direction:column;gap:10px;overflow:auto;padding:16px;background:#f5f8f9}.chat-messages .bubble{box-sizing:border-box;width:fit-content;max-width:80%;padding:8px 12px 9px;line-height:1.5;border-radius:6px;word-break:break-word;overflow-wrap:anywhere}.chat-messages .bubble p{margin:0;white-space:pre-wrap}.chat-messages .bubble-tag{display:inline-block;margin-bottom:4px;padding:0 6px;font-size:11px;line-height:18px;border-radius:3px}.chat-messages .self{align-self:flex-end;color:#fff;background:#176a82}.chat-messages .peer{align-self:flex-start;background:#fff}.chat-messages .peer .bubble-tag{color:#176a82;background:#e7f3f6}.chat-messages .peer.ai .bubble-tag{color:#1f6a5c;background:#dff3ef}.chat-messages .chat-hint{max-width:100%;margin:0;color:#6b7880;background:transparent}.chat-window form{display:flex;gap:8px;padding:12px;border-top:1px solid #e4eaed}.chat-window input{flex:1;min-width:0;padding:9px;border:1px solid #ced8dc;border-radius:4px}.chat-window form button{padding:0 14px;color:#fff;border:0;border-radius:4px;background:#176a82;cursor:pointer}.chat-error{margin:0;padding:0 12px 10px;color:#c23b36;font-size:12px}@media(max-width:600px){.chat-widget{right:16px;bottom:16px}.chat-window{height:420px}}
</style>
