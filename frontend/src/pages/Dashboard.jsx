
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, UserCheck, UserX, Percent } from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../components/StatCard";
import * as attendanceApi from "../api/attendance";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      try {
        const data = await attendanceApi.getTodayAttendance();

        setStats({
          totalStudents: data.total_students,
          presentToday: data.present_count,
          absentToday: data.absent_count,
          attendancePercent: data.attendance_percent,
          recentRecords: data.records,
          trend: [],
        });
      } catch (err) {
        console.error("Dashboard error:", err);

        toast.error("Failed to load dashboard data");

        setStats({
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          attendancePercent: 0,
          recentRecords: [],
          trend: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 30000);

    return function () {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchFullStats = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          "https://attendance-system-yqt6.onrender.com/api/attendance/dashboard/stats",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setStats(function (previous) {
            return {
              ...(previous || {}),
              trend: data.trend || [],
              recentRecords: data.recent_activity || [],
            };
          });
        } else {
          console.error(
            "Dashboard API error:",
            response.status,
            response.statusText
          );
        }
      } catch (err) {
        console.error("Failed to load dashboard trend:", err);
      }
    };

    fetchFullStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      </div>
    );
  }

  const chartData =
    (stats &&
      stats.trend &&
      stats.trend.map(function (point) {
        return {
          label: point.label,
          present: point.present_count,
          percent: point.percent,
        };
      })) ||
    [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats && stats.totalStudents !== undefined ? stats.totalStudents : 0}
          icon={Users}
          accent="brand"
        />

        <StatCard
          label="Present Today"
          value={stats && stats.presentToday !== undefined ? stats.presentToday : 0}
          icon={UserCheck}
          accent="green"
        />

        <StatCard
          label="Absent Today"
          value={stats && stats.absentToday !== undefined ? stats.absentToday : 0}
          icon={UserX}
          accent="red"
        />

        <StatCard
          label="Attendance %"
          value={
            (stats && stats.attendancePercent !== undefined
              ? stats.attendancePercent
              : 0) + "%"
          }
          icon={Percent}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Attendance Trend (Last 7 Days)
          </h2>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="label"
                  stroke="#6b7280"
                />

                <YAxis stroke="#6b7280" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{
                    color: "#f3f4f6",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="#3b6ff2"
                  strokeWidth={2}
                  dot={{
                    fill: "#3b6ff2",
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              No data yet. Attendance will appear here once students are marked.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>

          {stats &&
          stats.recentRecords &&
          stats.recentRecords.length > 0 ? (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentRecords.slice(0, 8).map(function (record) {
                return (
                  <li
                    key={record.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.full_name}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {record.roll_number} ·{" "}
                        {new Date(
                          record.date
                        ).toLocaleDateString()}{" "}
                        {record.time}
                      </p>
                    </div>

                    <span
                      className={
                        "text-xs px-2 py-1 rounded-full " +
                        (record.marked_by === "AI"
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300")
                      }
                    >
                      {record.marked_by}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No attendance records yet. Start marking attendance to see activity here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

