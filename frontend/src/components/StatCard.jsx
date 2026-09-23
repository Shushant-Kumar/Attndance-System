export default function StatCard({ label, value, icon: Icon, accent = "brand" }) {
  const accentClasses = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
