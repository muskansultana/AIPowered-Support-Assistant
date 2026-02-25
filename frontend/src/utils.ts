import { v4 as uuidv4 } from "uuid";

export const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem("sessionId");

  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("sessionId", sessionId);
  }

  return sessionId;
};

export const createNewSession = (): string => {
  const newId = uuidv4();
  localStorage.setItem("sessionId", newId);
  return newId;
};

export const getSessionStartTime = (): string => {
  let startTime = localStorage.getItem("sessionStartTime");
  
  if (!startTime) {
    startTime = new Date().toISOString();
    localStorage.setItem("sessionStartTime", startTime);
  }
  
  return startTime;
};

export const resetSessionTime = (): void => {
  localStorage.removeItem("sessionStartTime");
};

export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};