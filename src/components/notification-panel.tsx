"use client";

import { useState, useMemo, useEffect } from "react";
import type { Role } from "@/lib/rbac";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  timestamp: Date;
  read: boolean;
  region?: string;
}

interface NotificationPanelProps {
  userRole: Role;
}

export function NotificationPanel({ userRole }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "High Flood Risk Detected",
      message: "North District experiencing elevated flood risk due to heavy rainfall",
      type: "critical",
      timestamp: new Date("2024-01-15T09:30:00"),
      read: false,
      region: "North District",
    },
    {
      id: "2",
      title: "New Incident Report",
      message: "Infrastructure damage reported in East District",
      type: "warning",
      timestamp: new Date("2024-01-15T08:45:00"),
      read: false,
      region: "East District",
    },
    {
      id: "3",
      title: "System Update Complete",
      message: "Risk prediction model retrained with 87.5% accuracy",
      type: "success",
      timestamp: new Date("2024-01-15T07:00:00"),
      read: true,
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(() =>
    notifications.filter((n) => !n.read).length
  );

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "success":
        return "bg-emerald-500";
      case "info":
      default:
        return "bg-blue-500";
    }
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const formatTime = useMemo(() => {
    return (date: Date) => {
      const now = Date.now();
      const minutes = Math.floor((now - date.getTime()) / (1000 * 60));
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`cursor-pointer border-b border-slate-100 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                      !notification.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className={`h-2 w-2 rounded-full ${getTypeColor(notification.type)}`} />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <span>{formatTime(notification.timestamp)}</span>
                          {notification.region && (
                            <>
                              <span>•</span>
                              <span className="text-blue-500">{notification.region}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 p-3 dark:border-slate-700">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
