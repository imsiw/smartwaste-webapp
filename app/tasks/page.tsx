"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TgTheme = Record<string, string | undefined>;
type AppRole = "USER" | "CLEANER" | "ADMIN";
type ReportItem = {
  id: number;
  comment?: string | null;
  photoPath: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  task?: TaskItem | null;
};
type TaskItem = {
  id: number;
  comment?: string | null;
  photoPath: string;
  status: "NEW" | "IN_PROGRESS" | "DONE";
  createdAt: string;
  assignedTo?: { firstName?: string | null; username?: string | null } | null;
  createdBy?: { firstName?: string | null; username?: string | null } | null;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Некорректный ответ сервера" };
  }
}

export default function TasksPage() {
  const [isTg, setIsTg] = useState(false);
  const [theme, setTheme] = useState<TgTheme>({});
  const [role, setRole] = useState<AppRole>("USER");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [pendingReports, setPendingReports] = useState<ReportItem[]>([]);

  const colors = useMemo(() => {
    const eco = { bg: "#06130d", card: "#0b2217", text: "#e7fff2", hint: "#a7d9bf", accent: "#22c55e", border: "rgba(167, 217, 191, 0.18)", glow: "rgba(34, 197, 94, 0.22)", danger: "#f87171" };
    return {
      bg: theme.bg_color ?? eco.bg,
      card: theme.secondary_bg_color ?? eco.card,
      text: theme.text_color ?? eco.text,
      hint: theme.hint_color ?? eco.hint,
      accent: theme.button_color ?? eco.accent,
      border: eco.border,
      glow: eco.glow,
      danger: eco.danger,
    };
  }, [theme]);

  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    if (!tg) return;
    setIsTg(true);
    tg.ready();
    tg.expand();
    setTheme(tg.themeParams ?? {});
    loadData(tg.initData || "");
  }, [showDone]);

  async function loadData(initData: string) {
    setLoading(true);
    setStatusText("");
    try {
      const meRes = await fetch("/api/me", { headers: getTelegramHeaders() });
      const meData = await safeJson(meRes);
      if (!meData.ok) throw new Error(meData.error || "Не удалось загрузить профиль");
      const nextRole = meData.user.role as AppRole;
      setRole(nextRole);

      if (nextRole === "USER") {
        const res = await fetch("/api/my/status", { headers: { "x-telegram-init-data": initData } });
        const data = await safeJson(res);
        if (!data.ok) throw new Error(data.error || "Не удалось загрузить статусы");
        setReports(data.reports || []);
        setTasks([]);
        setPendingReports([]);
        setUsers([]);
      } else {
        const tasksRes = await fetch(`/api/tasks?openOnly=${showDone ? "false" : "true"}`, { headers: { "x-telegram-init-data": initData } });
        const tasksData = await safeJson(tasksRes);
        if (!tasksData.ok) throw new Error(tasksData.error || "Не удалось загрузить задачи");
        setTasks(tasksData.tasks || []);

        if (nextRole === "ADMIN") {
          const [reportsRes, usersRes] = await Promise.all([
            fetch("/api/admin/reports?pendingOnly=true", { headers: { "x-telegram-init-data": initData } }),
            fetch("/api/admin/users", { headers: { "x-telegram-init-data": initData } }),
          ]);
          const reportsData = await safeJson(reportsRes);
          const usersData = await safeJson(usersRes);
          setPendingReports(reportsData.reports || []);
          setUsers(usersData.users || []);
        } else {
          setPendingReports([]);
          setUsers([]);
        }
      }
    } catch (error: any) {
      setStatusText(error.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  function getInitData() {
    const tg: any = (window as any).Telegram?.WebApp;
    return tg?.initData || "";
  }

  async function taskAction(taskId: number, action: "start" | "reset" | "done") {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: getTelegramHeaders(),
      body: JSON.stringify({ action }),
    });
    const data = await safeJson(res);
    if (!data.ok) return setStatusText(data.error || "Не удалось обновить задачу");
    loadData(getInitData());
  }

  async function approveReport(id: number) {
    const res = await fetch(`/api/admin/reports/${id}/approve`, { method: "POST", headers: { "x-telegram-init-data": getInitData() } });
    const data = await safeJson(res);
    if (!data.ok) return setStatusText(data.error || "Не удалось одобрить репорт");
    loadData(getInitData());
  }

  async function rejectReport(id: number) {
    const res = await fetch(`/api/admin/reports/${id}/reject`, { method: "POST", headers: { "x-telegram-init-data": getInitData() } });
    const data = await safeJson(res);
    if (!data.ok) return setStatusText(data.error || "Не удалось отклонить репорт");
    loadData(getInitData());
  }

  async function deleteReport(id: number) {
    const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE", headers: { "x-telegram-init-data": getInitData() } });
    const data = await safeJson(res);
    if (!data.ok) return setStatusText(data.error || "Не удалось удалить репорт");
    loadData(getInitData());
  }

  async function deleteTask(id: number) {
    const res = await fetch(`/api/admin/tasks/${id}`, { method: "DELETE", headers: { "x-telegram-init-data": getInitData() } });
    const data = await safeJson(res);
    if (!data.ok) return setStatusText(data.error || "Не удалось удалить задачу");
    loadData(getInitData());
  }

  async function changeRole(userId: number, nextRole: AppRole) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await safeJson(res);
    if (!data.ok) return setStatusText(data.error || "Не удалось поменять роль");
    loadData(getInitData());
  }

  if (!isTg) {
    return <><Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" /><div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>Открой в Telegram.</div></>;
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 20% 10%, ${colors.glow}, transparent 55%), ${colors.bg}`, color: colors.text, padding: 16 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>{role === "USER" ? "Мои статусы" : role === "CLEANER" ? "Задачи уборщика" : "Админ-панель"}</h2>
            <Link href="/" style={{ textDecoration: "none", color: colors.text }}>← Назад</Link>
          </div>

          {(role === "CLEANER" || role === "ADMIN") && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12, background: colors.card }}>
              <div style={{ color: colors.hint, fontSize: 13 }}>Показывать выполненные задачи</div>
              <button onClick={() => setShowDone((v) => !v)} style={smallBtn(colors)}>{showDone ? "Скрыть" : "Показать"}</button>
            </div>
          )}

          {statusText && <div style={{ marginTop: 12, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12, background: colors.card, color: colors.danger }}>{statusText}</div>}
          {loading && <div style={{ marginTop: 12, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12, background: colors.card }}>Загрузка…</div>}

          {role === "USER" && reports.map((report) => (
            <Card key={report.id} colors={colors}>
              <img src={report.photoPath} alt="report" style={{ width: "100%", borderRadius: 12, marginBottom: 12 }} />
              <div style={{ fontWeight: 800 }}>{report.comment || "Без комментария"}</div>
              <div style={{ color: colors.hint, fontSize: 13, marginTop: 6 }}>Статус: {formatUserStatus(report)}</div>
              <div style={{ color: colors.hint, fontSize: 12, marginTop: 6 }}>{new Date(report.createdAt).toLocaleString("ru-RU")}</div>
            </Card>
          ))}

          {(role === "CLEANER" || role === "ADMIN") && tasks.map((task) => (
            <Card key={task.id} colors={colors}>
              <img src={task.photoPath} alt="task" style={{ width: "100%", borderRadius: 12, marginBottom: 12 }} />
              <div style={{ fontWeight: 800 }}>{task.comment || "Без комментария"}</div>
              <div style={{ color: colors.hint, fontSize: 13, marginTop: 6 }}>Статус: {formatTask(task.status)}</div>
              <div style={{ color: colors.hint, fontSize: 13, marginTop: 6 }}>Автор: {task.createdBy?.firstName || task.createdBy?.username || "пользователь"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {task.status !== "IN_PROGRESS" && task.status !== "DONE" && <button onClick={() => taskAction(task.id, "start")} style={smallBtn(colors)}>Взять в работу</button>}
                {task.status !== "NEW" && task.status !== "DONE" && <button onClick={() => taskAction(task.id, "reset")} style={smallBtn(colors)}>Вернуть в новое</button>}
                {task.status !== "DONE" && <button onClick={() => taskAction(task.id, "done")} style={smallBtn(colors)}>Выполнено</button>}
                {role === "ADMIN" && <button onClick={() => deleteTask(task.id)} style={dangerBtn(colors)}>Удалить</button>}
              </div>
            </Card>
          ))}

          {role === "ADMIN" && (
            <>
              <div style={{ marginTop: 18, fontWeight: 900, fontSize: 18 }}>Репорты на одобрение</div>
              {pendingReports.map((report) => (
                <Card key={report.id} colors={colors}>
                  <img src={report.photoPath} alt="report" style={{ width: "100%", borderRadius: 12, marginBottom: 12 }} />
                  <div style={{ fontWeight: 800 }}>{report.comment || "Без комментария"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    <button onClick={() => approveReport(report.id)} style={smallBtn(colors)}>Одобрить</button>
                    <button onClick={() => rejectReport(report.id)} style={smallBtn(colors)}>Отклонить</button>
                    <button onClick={() => deleteReport(report.id)} style={dangerBtn(colors)}>Удалить</button>
                  </div>
                </Card>
              ))}

              <div style={{ marginTop: 18, fontWeight: 900, fontSize: 18 }}>Пользователи и роли</div>
              {users.map((item) => (
                <Card key={item.id} colors={colors}>
                  <div style={{ fontWeight: 800 }}>{item.firstName || item.username || `user ${item.telegramId}`}</div>
                  <div style={{ color: colors.hint, fontSize: 13, marginTop: 6 }}>Текущая роль: {item.role}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    <button onClick={() => changeRole(item.id, "USER")} style={smallBtn(colors)}>User</button>
                    <button onClick={() => changeRole(item.id, "CLEANER")} style={smallBtn(colors)}>Cleaner</button>
                    <button onClick={() => changeRole(item.id, "ADMIN")} style={smallBtn(colors)}>Admin</button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function formatUserStatus(report: ReportItem) {
  if (report.status === "PENDING") return "На одобрении";
  if (report.status === "REJECTED") return "Отклонён";
  if (!report.task) return "Одобрен";
  return formatTask(report.task.status);
}

function formatTask(status: TaskItem["status"]) {
  if (status === "NEW") return "Новая";
  if (status === "IN_PROGRESS") return "В работе";
  return "Выполнено";
}

function Card({ children, colors }: any) {
  return <div style={{ border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12, marginTop: 12, background: colors.card }}>{children}</div>;
}

function smallBtn(colors: any): React.CSSProperties {
  return { border: `1px solid ${colors.border}`, borderRadius: 12, padding: "8px 12px", background: "rgba(255,255,255,0.04)", color: colors.text, cursor: "pointer", fontWeight: 700 };
}

function dangerBtn(colors: any): React.CSSProperties {
  return { ...smallBtn(colors), color: colors.danger };
}

function getTelegramHeaders() {
  const tg = (window as any).Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

  return {
    "Content-Type": "application/json",
    "x-telegram-id": user?.id ? String(user.id) : "",
    "x-telegram-username": user?.username || "",
    "x-telegram-first-name": user?.first_name || "",
    "x-telegram-last-name": user?.last_name || "",
  };
}